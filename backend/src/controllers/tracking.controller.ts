import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import {
  anonymizeIp,
  isRateLimited,
  validateProjectAccess,
} from '../services/security.service';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-dev';

/**
 * Helper untuk mengekstrak userId dari JWT cookie atau authorization header
 */
function extractUserId(req: Request): number | null {
  try {
    const rawToken =
      req.cookies?.token ||
      req.cookies?.jwt ||
      req.cookies?.session ||
      req.cookies?.auth_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!rawToken) return null;

    const decoded = jwt.verify(rawToken, JWT_SECRET) as any;
    const candidateId =
      decoded?.userId ?? decoded?.user_id ?? decoded?.id ?? decoded?.sub;
    const parsed = candidateId ? parseInt(String(candidateId), 10) : null;
    return isNaN(parsed as number) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Helper untuk mengekstrak IP address klien
 */
function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim().slice(0, 45);
  }
  return (req.socket.remoteAddress || req.ip || '127.0.0.1').slice(0, 45);
}

/**
 * Controller: POST /api/track/click
 * Menangani pelacakan klik CTA secara non-blocking dengan isolasi multi-project & proteksi keamanan
 */
export const trackClick = (req: Request, res: Response): void => {
  // 1. Non-blocking response: langsung kembalikan status HTTP 204 No Content
  // sebelum eksekusi query database berjalan
  res.status(204).end();

  // Eksekusi asinkron di background (fire-and-forget)
  void (async () => {
    try {
      const rawIp = extractClientIp(req);

      // Proteksi 1: Rate Limiter per IP untuk mencegah spamming/DDoS
      if (isRateLimited(rawIp)) {
        console.warn(`[Security] Rate limit exceeded for IP: ${rawIp}`);
        return;
      }

      const body = req.body || {};
      const elementId: string | undefined = body.elementId || body.element_id;
      const pagePath: string | undefined = body.pagePath || body.page_path;
      const sessionId: string =
        body.sessionId || body.session_id || `sess_anon_${Date.now()}`;

      // Ambil Project ID dan Write Key dari header atau payload
      const projectId: string =
        (req.headers['x-project-id'] as string) ||
        body.projectId ||
        body.project_id ||
        'prj_default';

      const writeKey: string | undefined =
        (req.headers['x-write-key'] as string) ||
        body.writeKey ||
        body.write_key ||
        undefined;

      const originHeader =
        (req.headers.origin as string) ||
        (req.headers.referer as string) ||
        null;

      // Proteksi 2: Validasi Project, Write Key, dan Domain Whitelisting
      const validation = await validateProjectAccess(projectId, writeKey, originHeader);
      if (!validation.valid) {
        console.warn(`[Security Rejected] Project "${projectId}": ${validation.reason}`);
        return;
      }

      // Validasi kelengkapan payload
      if (
        !elementId ||
        typeof elementId !== 'string' ||
        !pagePath ||
        typeof pagePath !== 'string'
      ) {
        console.warn('[Track Click] Rejected: Missing elementId or pagePath.', {
          elementId,
          pagePath,
        });
        return;
      }

      // Proteksi 3: IP Anonymization (GDPR/UU PDP compliance)
      const ipAddress = anonymizeIp(rawIp);
      const userAgent = (req.headers['user-agent'] || null) as string | null;
      const userId = extractUserId(req);

      // Eksekusi penyimpanan ke basis data dengan scope project_id
      const insertEventQuery = `
        INSERT INTO click_events (
          project_id,
          element_id, 
          page_path, 
          session_id, 
          user_id, 
          user_agent, 
          ip_address, 
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
      `;

      // Atomic UPSERT terisolasi per (project_id, element_id, page_path)
      const upsertMetricQuery = `
        INSERT INTO cta_metrics (project_id, element_id, page_path, total_clicks, last_clicked_at) 
        VALUES ($1, $2, $3, 1, NOW()) 
        ON CONFLICT (project_id, element_id, page_path) 
        DO UPDATE SET 
          total_clicks = cta_metrics.total_clicks + 1, 
          last_clicked_at = NOW();
      `;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(insertEventQuery, [
          projectId,
          elementId.slice(0, 100),
          pagePath.slice(0, 255),
          sessionId.slice(0, 100),
          userId,
          userAgent,
          ipAddress,
        ]);
        await client.query(upsertMetricQuery, [
          projectId,
          elementId.slice(0, 100),
          pagePath.slice(0, 255),
        ]);
        await client.query('COMMIT');

        console.log(
          `[Track Click] Successfully tracked: project="${projectId}", element="${elementId}", path="${pagePath}", ip="${ipAddress}"`
        );
      } catch (dbErr: any) {
        await client.query('ROLLBACK');
        console.error('[Track Click DB Error] Query execution failed:', dbErr.message);
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[Track Click Internal Error] Unexpected error:', err.message);
    }
  })();
};

/**
 * Controller: GET /api/track/metrics
 * Mengambil ringkasan cta_metrics yang difilter khusus untuk project tertentu
 */
export const getCtaMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || 'prj_default';

    const { rows } = await pool.query(
      `SELECT project_id, element_id, page_path, total_clicks::text, last_clicked_at 
       FROM cta_metrics 
       WHERE project_id = $1
       ORDER BY total_clicks DESC, last_clicked_at DESC 
       LIMIT 100;`,
      [projectId]
    );
    res.json({ success: true, projectId, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('[Get Metrics Error]', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch CTA metrics' });
  }
};

/**
 * Controller: GET /api/track/events
 * Mengambil riwayat event click_events yang difilter khusus untuk project tertentu
 */
export const getClickEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || 'prj_default';

    const { rows } = await pool.query(
      `SELECT id::text, project_id, element_id, page_path, session_id, user_id, user_agent, ip_address, created_at 
       FROM click_events 
       WHERE project_id = $1
       ORDER BY created_at DESC 
       LIMIT 50;`,
      [projectId]
    );
    res.json({ success: true, projectId, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('[Get Events Error]', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch click events' });
  }
};
