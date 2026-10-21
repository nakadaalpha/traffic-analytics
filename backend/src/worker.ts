import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

export type Variables = {
  user?: {
    id: string;
    username: string;
    email: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// -------------------------------------------------------------
// Security & Utilities (Web Crypto PBKDF2 Password Hashing)
// -------------------------------------------------------------
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BYTES * 8
  );

  return `${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [saltHex, originalHashHex] = parts;
    const salt = hexToBuffer(saltHex);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_BYTES * 8
    );

    const computedHashHex = bufferToHex(derivedBits);
    return computedHashHex === originalHashHex;
  } catch {
    return false;
  }
}

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

// Helper untuk mengekstrak hostname murni dari URL / Origin / Referer
function extractHostname(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const clean = input.trim();
    // Tambahkan protokol jika user hanya menginput "domain.com"
    const urlString = clean.startsWith('http://') || clean.startsWith('https://')
      ? clean
      : `https://${clean}`;
    const parsed = new URL(urlString);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Helper untuk memeriksa apakah origin diizinkan secara cerdas
function isOriginAllowed(originHeader: string | null, allowedOriginsJson: string | null | undefined): boolean {
  if (!originHeader) return true; // Beacon terkadang tidak mengirim origin tapi mengirim referer

  const incomingHost = extractHostname(originHeader);
  if (!incomingHost) return false;

  // 1. Selalu izinkan localhost & 127.0.0.1 pada port berapa pun (Vite, Next.js, CRA, Astro, dll)
  if (
    incomingHost === 'localhost' ||
    incomingHost === '127.0.0.1' ||
    incomingHost.endsWith('.localhost')
  ) {
    return true;
  }

  // 2. Cocokkan dengan whitelist domain project
  if (!allowedOriginsJson) return false;

  try {
    const list: string[] = JSON.parse(allowedOriginsJson);
    if (list.includes('*')) return true;

    return list.some((allowed) => {
      if (allowed === '*') return true;
      const allowedHost = extractHostname(allowed);
      if (!allowedHost) return false;

      // Izinkan subdomain atau host yang sama persis
      return (
        incomingHost === allowedHost ||
        incomingHost.endsWith(`.${allowedHost}`)
      );
    });
  } catch {
    return false;
  }
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

function getJwtSecret(c: any): string {
  return c.env.JWT_SECRET || 'traffic_analytics_super_secret_jwt_key_2026';
}

// -------------------------------------------------------------
// Middleware: CORS (Support Credentials for Cookies)
// -------------------------------------------------------------
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Izinkan request dari Vercel, localhost, atau origin apa pun dengan kredensial
      return origin || '*';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-project-id',
      'x-write-key',
      'x-requested-with',
    ],
  })
);

// -------------------------------------------------------------
// Auth Middleware: Check Cookie or Bearer Token
// -------------------------------------------------------------
async function authMiddleware(c: any, next: any) {
  try {
    const token =
      getCookie(c, 'auth_token') ||
      c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return c.json({ success: false, error: 'Unauthorized: Sesi tidak ditemukan' }, 401);
    }

    const payload = (await verify(token, getJwtSecret(c), 'HS256')) as any;
    if (!payload || !payload.sub) {
      return c.json({ success: false, error: 'Unauthorized: Token tidak valid' }, 401);
    }

    c.set('user', {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    });

    await next();
  } catch (err: any) {
    return c.json({ success: false, error: 'Unauthorized: Sesi kedaluwarsa atau tidak sah' }, 401);
  }
}

// -------------------------------------------------------------
// Health Check Endpoint
// -------------------------------------------------------------
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    engine: 'cloudflare-workers-d1',
    auth_enabled: true,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Auth Routes: Register, Login, Logout, Me
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    // 1. Validasi Input
    if (!name || name.length < 2) {
      return c.json({ success: false, error: 'Nama lengkap minimal 2 karakter' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return c.json({ success: false, error: 'Format alamat email tidak valid' }, 400);
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!username || !usernameRegex.test(username)) {
      return c.json(
        {
          success: false,
          error: 'Username harus alfanumerik (huruf, angka, garis bawah) 3-30 karakter',
        },
        400
      );
    }

    if (!password || password.length < 8) {
      return c.json({ success: false, error: 'Kata sandi minimal 8 karakter' }, 400);
    }

    // 2. Cek duplikasi email atau username
    const existing = await c.env.DB.prepare(
      `SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1;`
    )
      .bind(email, username)
      .first<any>();

    if (existing) {
      if (existing.email === email) {
        return c.json({ success: false, error: 'Alamat email sudah terdaftar' }, 409);
      }
      return c.json({ success: false, error: 'Username sudah digunakan orang lain' }, 409);
    }

    // 3. Hash Password dengan Web Crypto PBKDF2
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, username, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'));`
    )
      .bind(userId, name, email, username, passwordHash)
      .run();

    return c.json(
      {
        success: true,
        message: 'Registrasi berhasil. Silakan masuk.',
        data: {
          id: userId,
          name,
          email,
          username,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('[Register Error]', error.message);
    return c.json({ success: false, error: 'Gagal melakukan registrasi' }, 500);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const identifier = String(body.identifier || body.username || body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const rememberMe = Boolean(body.rememberMe);

    if (!identifier || !password) {
      return c.json(
        { success: false, error: 'Email/username dan kata sandi wajib diisi' },
        400
      );
    }

    // Cari user berdasarkan email ATAU username
    const user = await c.env.DB.prepare(
      `SELECT id, name, email, username, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1;`
    )
      .bind(identifier, identifier)
      .first<any>();

    const GENERIC_ERROR = 'Email/username atau kata sandi tidak valid';

    if (!user || !user.password_hash) {
      return c.json({ success: false, error: GENERIC_ERROR }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ success: false, error: GENERIC_ERROR }, 401);
    }

    // Masa berlaku token: 30 hari jika Remember Me, 1 hari jika standar
    const expirationSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        iat: now,
        exp: now + expirationSeconds,
      },
      getJwtSecret(c),
      'HS256'
    );

    // Set cookie HttpOnly
    setCookie(c, 'auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: expirationSeconds,
    });

    return c.json({
      success: true,
      message: 'Login berhasil',
      token, // Juga kembalikan token agar frontend bisa menyimpan di client memory jika perlu
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('[Login Error]', error.message);
    return c.json({ success: false, error: 'Gagal melakukan login' }, 500);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'auth_token', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  });
  return c.json({ success: true, message: 'Berhasil keluar (logout)' });
});

// GET /api/auth/me (Verifikasi sesi saat ini)
app.get('/api/auth/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ success: true, data: user });
});

// Helper untuk mengekstrak identitas user dari cookie atau Authorization header
async function extractCurrentUser(c: any): Promise<{ id: string; username: string; email: string } | null> {
  try {
    const token =
      getCookie(c, 'auth_token') ||
      c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const payload = (await verify(token, getJwtSecret(c), 'HS256')) as any;
    if (!payload || !payload.sub) return null;
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Project & Metrics Endpoints (Protected & User-Isolated)
// -------------------------------------------------------------

// GET /api/track/projects (Ketat: HANYA menampilkan project milik user yang sedang login)
app.get('/api/track/projects', async (c) => {
  try {
    const currentUser = await extractCurrentUser(c);

    if (!currentUser) {
      return c.json({ success: true, count: 0, data: [] });
    }

    const query = `SELECT id, name, public_write_key, allowed_origins, is_active, owner_id, created_at 
                   FROM projects 
                   WHERE owner_id = ? 
                   ORDER BY created_at DESC;`;

    const { results } = await c.env.DB.prepare(query).bind(currentUser.id).all();

    const formatted = results.map((row: any) => {
      let origins = [];
      try {
        origins = JSON.parse(row.allowed_origins || '[]');
      } catch {
        origins = [row.allowed_origins];
      }
      return {
        id: row.id,
        name: row.name,
        writeKey: row.public_write_key,
        allowedOrigins: origins,
        isActive: Boolean(row.is_active),
        ownerId: row.owner_id,
        createdAt: row.created_at,
      };
    });

    return c.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    console.error('[Get Projects Error]', error.message);
    return c.json({ success: false, error: 'Failed to fetch projects' }, 500);
  }
});

// POST /api/track/projects (Wajib terikat ke owner_id user yang sedang login)
app.post('/api/track/projects', async (c) => {
  try {
    const currentUser = await extractCurrentUser(c);
    const ownerId = currentUser ? currentUser.id : null;

    const body = await c.req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const domain = (body.domain || '').trim();

    if (!name || !domain) {
      return c.json({ success: false, error: 'Nama project dan domain wajib diisi' }, 400);
    }

    const idSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    const projectId = `prj_${idSlug}_${Math.random().toString(36).substring(2, 6)}`;
    const writeKey = `pk_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

    // Normalisasi domain input (bersihkan trailing slash, protokol, dll)
    const normalizedDomain = extractHostname(domain) || domain.replace(/\/+$/, '');
    const allowedOrigins = [normalizedDomain];

    await c.env.DB.prepare(
      `INSERT INTO projects (id, name, public_write_key, allowed_origins, is_active, owner_id)
       VALUES (?, ?, ?, ?, 1, ?);`
    )
      .bind(projectId, name, writeKey, JSON.stringify(allowedOrigins), ownerId)
      .run();

    return c.json(
      {
        success: true,
        message: 'Project berhasil didaftarkan',
        data: {
          id: projectId,
          name,
          writeKey,
          allowedOrigins,
          isActive: true,
          ownerId,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('[Create Project Error]', error.message);
    return c.json({ success: false, error: error.message || 'Failed to create project' }, 500);
  }
});

// GET /api/track/metrics (Cek kepemilikan project sebelum menampilkan)
app.get('/api/track/metrics', async (c) => {
  try {
    const projectId = c.req.query('projectId') || 'prj_default';
    const currentUser = await extractCurrentUser(c);

    // Verifikasi kepemilikan project di D1
    const project = await c.env.DB.prepare(`SELECT id, owner_id FROM projects WHERE id = ? LIMIT 1;`)
      .bind(projectId)
      .first<any>();

    if (project && project.owner_id) {
      // Jika project memiliki pemilik, pastikan user yang login adalah pemiliknya
      if (!currentUser || currentUser.id !== project.owner_id) {
        return c.json({ success: false, error: 'Forbidden: Anda tidak memiliki akses ke project ini' }, 403);
      }
    }

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

// GET /api/track/events (Cek kepemilikan project sebelum menampilkan)
app.get('/api/track/events', async (c) => {
  try {
    const projectId = c.req.query('projectId') || 'prj_default';
    const currentUser = await extractCurrentUser(c);

    // Verifikasi kepemilikan project di D1
    const project = await c.env.DB.prepare(`SELECT id, owner_id FROM projects WHERE id = ? LIMIT 1;`)
      .bind(projectId)
      .first<any>();

    if (project && project.owner_id) {
      if (!currentUser || currentUser.id !== project.owner_id) {
        return c.json({ success: false, error: 'Forbidden: Anda tidak memiliki akses ke project ini' }, 403);
      }
    }

    const limitParam = parseInt(c.req.query('limit') || '200', 10);
    const limit = isNaN(limitParam) ? 200 : Math.min(Math.max(limitParam, 1), 1000);

    const { results } = await c.env.DB.prepare(
      `SELECT CAST(id AS TEXT) as id, project_id, element_id, page_path, session_id, user_id, user_agent, ip_address, created_at 
       FROM click_events 
       WHERE project_id = ?
       ORDER BY created_at DESC 
       LIMIT ?;`
    )
      .bind(projectId, limit)
      .all();

    return c.json({ success: true, projectId, count: results.length, data: results });
  } catch (error: any) {
    console.error('[Get Events Error]', error.message);
    return c.json({ success: false, error: 'Failed to fetch click events' }, 500);
  }
});

// -------------------------------------------------------------
// POST /api/track/click (Public High-Performance Ingestion)
// -------------------------------------------------------------
app.post('/api/track/click', async (c) => {
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

      // Check allowed origin dengan cerdas (Abaikan trailing slash, port, dan auto-allow localhost)
      if (originHeader && project.allowed_origins) {
        const allowed = isOriginAllowed(originHeader, project.allowed_origins);
        if (!allowed) {
          console.warn(`[Security Rejected] Origin "${originHeader}" not whitelisted for project "${projectId}"`);
          return;
        }
      }

      if (!elementId || !pagePath) {
        return;
      }

      const anonymized = anonymizeIp(rawIp);
      const userAgent = c.req.header('user-agent') || null;

      // Atomic batch statement D1
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

  return c.body(null, 204);
});

export default app;
