import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-project-id', 'x-write-key'],
  })
);

// Anonymize IP address (GDPR / UU PDP compliance)
function anonymizeIp(ip: string | undefined | null): string {
  if (!ip) return '0.0.0.0';
  if (ip.includes('.')) {
    return ip.replace(/\.\d+$/, '.0');
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  return ip;
}

// In-Memory Rate Limiter per worker isolate
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', engine: 'cloudflare-workers-d1', timestamp: new Date().toISOString() });
});

// GET /api/track/metrics
app.get('/api/track/metrics', async (c) => {
  try {
    const projectId = c.req.query('projectId') || 'prj_default';
    const { results } = await c.env.DB.prepare(
      `SELECT project_id, element_id, page_path, CAST(total_clicks AS TEXT) as total_clicks, last_clicked_at 
       FROM cta_metrics 
       WHERE project_id = ?
       ORDER BY total_clicks DESC, last_clicked_at DESC 
       LIMIT 100;`
    )
      .bind(projectId)
      .all();

    return c.json({ success: true, projectId, count: results.length, data: results });
  } catch (error: any) {
    console.error('[Get Metrics Error]', error.message);
    return c.json({ success: false, error: 'Failed to fetch CTA metrics' }, 500);
  }
});

// GET /api/track/events
app.get('/api/track/events', async (c) => {
  try {
    const projectId = c.req.query('projectId') || 'prj_default';
    const { results } = await c.env.DB.prepare(
      `SELECT CAST(id AS TEXT) as id, project_id, element_id, page_path, session_id, user_id, user_agent, ip_address, created_at 
       FROM click_events 
       WHERE project_id = ?
       ORDER BY created_at DESC 
       LIMIT 50;`
    )
      .bind(projectId)
      .all();

    return c.json({ success: true, projectId, count: results.length, data: results });
  } catch (error: any) {
    console.error('[Get Events Error]', error.message);
    return c.json({ success: false, error: 'Failed to fetch click events' }, 500);
  }
});

// POST /api/track/click (Fire-and-forget background tracking)
app.post('/api/track/click', async (c) => {
  // Capture client info
  const rawIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  let body: any = {};
  try {
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await c.req.json();
    } else {
      const text = await c.req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }
  } catch {
    body = {};
  }

  const elementId = body.elementId || body.element_id;
  const pagePath = body.pagePath || body.page_path;
  const sessionId = body.sessionId || body.session_id || `sess_anon_${Date.now()}`;
  const projectId =
    c.req.header('x-project-id') || body.projectId || body.project_id || 'prj_default';
  const writeKey = c.req.header('x-write-key') || body.writeKey || body.write_key;
  const originHeader = c.req.header('origin') || c.req.header('referer') || null;

  // Background execution with c.executionCtx.waitUntil (Non-blocking response)
  const task = (async () => {
    try {
      if (isRateLimited(rawIp)) {
        console.warn(`[Security] Rate limit exceeded for IP: ${rawIp}`);
        return;
      }

      // Validasi Project & Write Key
      const project = await c.env.DB.prepare(
        `SELECT id, name, public_write_key, allowed_origins, is_active FROM projects WHERE id = ?`
      )
        .bind(projectId)
        .first<any>();

      if (!project || !project.is_active) {
        console.warn(`[Security Rejected] Project "${projectId}" inactive or not found`);
        return;
      }

      if (writeKey && project.public_write_key !== writeKey) {
        console.warn(`[Security Rejected] Invalid write key for project "${projectId}"`);
        return;
      }

      // Check allowed origin
      if (originHeader && project.allowed_origins) {
        try {
          const allowedList: string[] = JSON.parse(project.allowed_origins);
          const isAllowed =
            allowedList.includes('*') ||
            allowedList.some((allowed) => allowed === '*' || originHeader.startsWith(allowed));
          if (!isAllowed) {
            console.warn(`[Security Rejected] Origin "${originHeader}" not whitelisted`);
            return;
          }
        } catch {
          // ignore parse error
        }
      }

      if (!elementId || !pagePath) {
        return;
      }

      const anonymized = anonymizeIp(rawIp);
      const userAgent = c.req.header('user-agent') || null;

      // Atomic batch statement D1 (Mirip transaction)
      await c.env.DB.batch([
        c.env.DB.prepare(
          `INSERT INTO click_events (
            project_id, element_id, page_path, session_id, user_id, user_agent, ip_address, created_at
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, datetime('now'));`
        ).bind(
          projectId,
          String(elementId).slice(0, 100),
          String(pagePath).slice(0, 255),
          String(sessionId).slice(0, 100),
          userAgent,
          anonymized
        ),
        c.env.DB.prepare(
          `INSERT INTO cta_metrics (project_id, element_id, page_path, total_clicks, last_clicked_at)
           VALUES (?, ?, ?, 1, datetime('now'))
           ON CONFLICT (project_id, element_id, page_path)
           DO UPDATE SET 
             total_clicks = cta_metrics.total_clicks + 1,
             last_clicked_at = datetime('now');`
        ).bind(
          projectId,
          String(elementId).slice(0, 100),
          String(pagePath).slice(0, 255)
        ),
      ]);
    } catch (err: any) {
      console.error('[Track Click D1 Error]', err.message);
    }
  })();

  if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
    c.executionCtx.waitUntil(task);
  } else {
    task.catch(() => {});
  }

  // HTTP 204 No Content langsung kembali instan
  return c.body(null, 204);
});

export default app;
