import { pool } from '../config/db';

export interface ProjectInfo {
  id: string;
  name: string;
  publicWriteKey: string;
  allowedOrigins: string[];
  isActive: boolean;
}

// In-memory cache untuk info project agar verifikasi berkecepatan tinggi (< 1ms)
const projectCache = new Map<string, { data: ProjectInfo; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 menit

/**
 * Anonymize IP address untuk kepatuhan regulasi privasi (GDPR / UU PDP)
 * Mengaburkan oktet terakhir IPv4 atau blok akhir IPv6
 */
export function anonymizeIp(ip: string | undefined | null): string {
  if (!ip) return '0.0.0.0';
  
  // Tangani IPv4
  if (ip.includes('.')) {
    return ip.replace(/\.\d+$/, '.0');
  }

  // Tangani IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }

  return ip;
}

/**
 * In-Memory Rate Limiter sederhana untuk melindungi endpoint pelacakan
 * Batas: Max 100 requests per menit per IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

/**
 * Validasi Project ID, Public Write Key, dan Domain Whitelist
 */
export async function validateProjectAccess(
  projectId: string,
  writeKey?: string | null,
  originHeader?: string | null
): Promise<{ valid: boolean; reason?: string; project?: ProjectInfo }> {
  const now = Date.now();
  let project: ProjectInfo | undefined;

  // 1. Cek dari Cache
  const cached = projectCache.get(projectId);
  if (cached && now < cached.expiresAt) {
    project = cached.data;
  } else {
    // 2. Kueri dari Database
    try {
      const { rows } = await pool.query(
        `SELECT id, name, public_write_key, allowed_origins, is_active 
         FROM projects 
         WHERE id = $1`,
        [projectId]
      );

      if (rows.length === 0) {
        return { valid: false, reason: `Project "${projectId}" not registered` };
      }

      project = {
        id: rows[0].id,
        name: rows[0].name,
        publicWriteKey: rows[0].public_write_key,
        allowedOrigins: rows[0].allowed_origins || [],
        isActive: rows[0].is_active,
      };

      projectCache.set(projectId, { data: project, expiresAt: now + CACHE_TTL_MS });
    } catch (err: any) {
      console.error('[Security Service Error]', err.message);
      return { valid: false, reason: 'Database verification failed' };
    }
  }

  if (!project.isActive) {
    return { valid: false, reason: `Project "${projectId}" is suspended` };
  }

  // 3. Validasi Public Write Key (jika disuplai)
  if (writeKey && project.publicWriteKey && writeKey !== project.publicWriteKey) {
    return { valid: false, reason: 'Invalid public write key' };
  }

  // 4. Validasi Domain Whitelist (CORS / Origin Check)
  if (originHeader && project.allowedOrigins && project.allowedOrigins.length > 0) {
    const isAllowed = project.allowedOrigins.some((allowed) => {
      if (allowed === '*') return true;
      try {
        const allowedUrl = new URL(allowed).origin;
        const requestOrigin = new URL(originHeader).origin;
        return allowedUrl === requestOrigin;
      } catch {
        return allowed.includes(originHeader);
      }
    });

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Domain origin "${originHeader}" not in project whitelist`,
      };
    }
  }

  return { valid: true, project };
}
