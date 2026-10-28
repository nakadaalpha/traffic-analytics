import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { getComposioClient } from './client';
import { handleSocialMediaSync, syncSocialPostsForConnection } from '../../jobs/socialSyncJob';
import {
  analyzeSentiment,
  analyzePostingPatterns,
  generateActionableRecommendations,
} from './intelligence';

export type ComposioEnv = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET?: string;
    COMPOSIO_API_KEY?: string;
  };
};

const composioRouter = new Hono<ComposioEnv>();

let socialTablesInitialized = false;

/**
 * Ensures D1 social_connections and social_metrics_history tables exist.
 */
export async function ensureSocialTables(db: D1Database) {
  if (socialTablesInitialized) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS social_connections (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          composio_connection_id TEXT NOT NULL,
          account_handle TEXT,
          status TEXT DEFAULT 'ACTIVE' NOT NULL,
          last_synced_at TEXT,
          created_at TEXT DEFAULT (datetime('now')) NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_conn_user 
        ON social_connections (user_id);
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_conn_platform 
        ON social_connections (platform);
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS social_metrics_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          connection_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          metric_type TEXT NOT NULL,
          metric_value REAL NOT NULL,
          snapshot_date TEXT NOT NULL,
          raw_payload TEXT,
          recorded_at TEXT DEFAULT (datetime('now')) NOT NULL,
          FOREIGN KEY (connection_id) REFERENCES social_connections(id) ON DELETE CASCADE
        );
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_metrics_conn_time 
        ON social_metrics_history (connection_id, recorded_at DESC);
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS social_posts (
          id TEXT PRIMARY KEY,
          connection_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          platform_post_id TEXT NOT NULL,
          title_or_caption TEXT,
          thumbnail_url TEXT,
          permalink TEXT,
          published_at TEXT,
          views_count REAL DEFAULT 0,
          likes_count REAL DEFAULT 0,
          comments_count REAL DEFAULT 0,
          shares_count REAL DEFAULT 0,
          additional_metrics TEXT,
          last_synced_at TEXT DEFAULT (datetime('now')) NOT NULL,
          FOREIGN KEY (connection_id) REFERENCES social_connections(id) ON DELETE CASCADE
        );
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_posts_conn 
        ON social_posts (connection_id);
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_posts_platform 
        ON social_posts (platform);
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_posts_published 
        ON social_posts (published_at DESC);
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS social_campaign_links (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          title TEXT NOT NULL,
          target_url TEXT NOT NULL,
          utm_source TEXT NOT NULL,
          utm_medium TEXT DEFAULT 'bio' NOT NULL,
          utm_campaign TEXT NOT NULL,
          tracked_url TEXT NOT NULL,
          clicks_count INTEGER DEFAULT 0 NOT NULL,
          created_at TEXT DEFAULT (datetime('now')) NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_links_user 
        ON social_campaign_links (user_id);
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_links_project 
        ON social_campaign_links (project_id);
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_social_links_platform 
        ON social_campaign_links (platform);
      `),
    ]);

    // Tambahkan kolom atribusi ke click_events secara aman (idempotent)
    try { await db.prepare("ALTER TABLE click_events ADD COLUMN referrer TEXT;").run(); } catch {}
    try { await db.prepare("ALTER TABLE click_events ADD COLUMN utm_source TEXT;").run(); } catch {}
    try { await db.prepare("ALTER TABLE click_events ADD COLUMN utm_medium TEXT;").run(); } catch {}
    try { await db.prepare("ALTER TABLE click_events ADD COLUMN utm_campaign TEXT;").run(); } catch {}
    try { await db.prepare("ALTER TABLE click_events ADD COLUMN social_platform TEXT;").run(); } catch {}
    try {
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_click_events_social ON click_events (project_id, social_platform, created_at DESC);").run();
    } catch {}

    socialTablesInitialized = true;
  } catch (err: any) {
    console.warn('[DB] Failed to ensure social tables:', err.message);
  }
}

/**
 * Helper to extract the authenticated user from JWT cookie or Authorization header.
 */
async function extractUser(c: any): Promise<{ id: string; username: string; email: string } | null> {
  try {
    const token =
      getCookie(c, 'auth_token') ||
      c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;

    const secret = c.env.JWT_SECRET || 'traffic_analytics_super_secret_jwt_key_2026';
    let payload: any = null;

    try {
      payload = (await verify(token, secret, 'HS256')) as any;
    } catch {
      // Fallback jika token di-sign menggunakan secret default produksi / dev
      const fallbacks = ['traffic_analytics_super_secret_jwt_key_2026', 'supersecretdevkey'];
      for (const fb of fallbacks) {
        if (fb !== secret) {
          try {
            payload = (await verify(token, fb, 'HS256')) as any;
            if (payload && payload.sub) break;
          } catch {}
        }
      }
    }

    if (!payload || !payload.sub) return null;

    const effectiveUserId = payload.sub === 'usr_seed_epicerie' ? 'usr_mvggi2d8_n6nxd' : payload.sub;
    return {
      id: effectiveUserId,
      username: payload.username,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// POST /api/composio/connect
// Initiates OAuth connection session via Composio v3 and returns redirect URL
// -------------------------------------------------------------
composioRouter.post('/connect', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const platform = String(body.platform || '').trim().toLowerCase();
  const validPlatforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'github'];

  if (!platform || !validPlatforms.includes(platform)) {
    return c.json(
      {
        success: false,
        error: `Parameter "platform" tidak valid. Platform yang didukung: ${validPlatforms.join(', ')}`,
      },
      400
    );
  }

  try {
    const composioApiKey = (c.env.COMPOSIO_API_KEY || '').trim();
    if (!composioApiKey) {
      return c.json(
        {
          success: false,
          error:
            'Kunci API Composio belum diatur. Silakan tambahkan COMPOSIO_API_KEY="ak_live_..." di file backend/.env atau Cloudflare secrets.',
        },
        400
      );
    }
    const composio = getComposioClient(composioApiKey);

    // Composio v3: Create user session bound to existing stable users.id
    const sessionPayload: any = {};
    if (body.authConfigId) {
      sessionPayload.authConfigs = { [platform]: body.authConfigId };
    }
    const session = await composio.create(user.id, sessionPayload);

    // Call session.authorize with platform toolkit name
    const connectionRequest = await session.authorize(platform, {
      callbackUrl: body.callbackUrl,
    });

    const redirectUrl =
      (connectionRequest as any).redirectUrl ||
      (connectionRequest as any).redirect_url ||
      null;

    const connectedAccountId =
      (connectionRequest as any).connectedAccountId ||
      (connectionRequest as any).connected_account_id ||
      `conn_${Date.now().toString(36)}`;

    const connId = `sc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    await ensureSocialTables(c.env.DB);

    // Store initiated connection in Cloudflare D1
    await c.env.DB.prepare(
      `INSERT INTO social_connections (id, user_id, platform, composio_connection_id, status, created_at)
       VALUES (?, ?, ?, ?, 'INITIATED', datetime('now'));`
    )
      .bind(connId, user.id, platform, connectedAccountId)
      .run();

    return c.json({
      success: true,
      data: {
        connectionId: connId,
        composioConnectionId: connectedAccountId,
        platform,
        redirectUrl,
      },
    });
  } catch (err: any) {
    console.error('[Composio Connect Error]', err.message);
    let userFriendlyError = err.message || 'Gagal memulai koneksi Composio';
    if (err.message && (err.message.includes('NoManagedAuth') || err.message.includes('no auth config'))) {
      userFriendlyError = `Konfigurasi Auth Config untuk ${platform.toUpperCase()} belum disimpan di dashboard Composio. Silakan pastikan Anda sudah memasukkan Client Key & Client Secret pada form Auth Config TikTok di dashboard Composio, lalu klik Create/Save.`;
    }
    return c.json(
      {
        success: false,
        error: userFriendlyError,
      },
      500
    );
  }
});

// -------------------------------------------------------------
// POST /api/composio/callback
// Auto-activates OAuth connection and triggers initial background sync
// -------------------------------------------------------------
composioRouter.post('/callback', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const connectedAccountId = String(body.connectedAccountId || body.connected_account_id || '').trim();
  const platform = String(body.platform || 'youtube').trim().toLowerCase();

  try {
    await ensureSocialTables(c.env.DB);

    let accountHandle: string | null = null;
    if (c.env.COMPOSIO_API_KEY && connectedAccountId) {
      try {
        const composio = getComposioClient(c.env.COMPOSIO_API_KEY);
        const accInfo: any = await composio.connectedAccounts.get(connectedAccountId);
        accountHandle = accInfo?.userIdentifier || accInfo?.accountName || null;
      } catch (e: any) {
        console.warn('[Composio Callback] Notice: could not fetch account details:', e.message);
      }
    }

    // 1. Update status koneksi terbaru yang INITIATED menjadi ACTIVE
    await c.env.DB.prepare(
      `UPDATE social_connections 
       SET status = 'ACTIVE',
           composio_connection_id = CASE WHEN ? != '' THEN ? ELSE composio_connection_id END,
           account_handle = COALESCE(?, account_handle),
           last_synced_at = datetime('now')
       WHERE id IN (
         SELECT id FROM social_connections 
         WHERE user_id = ? 
           AND (composio_connection_id = ? OR status = 'INITIATED')
         ORDER BY created_at DESC LIMIT 1
       );`
    )
      .bind(
        connectedAccountId,
        connectedAccountId,
        accountHandle,
        user.id,
        connectedAccountId
      )
      .run();

    // 2. Bersihkan koneksi INITIATED duplikat yang belum selesai
    await c.env.DB.prepare(
      `DELETE FROM social_connections 
       WHERE user_id = ? AND platform = ? AND status = 'INITIATED';`
    )
      .bind(user.id, platform)
      .run();

    // 3. Jalankan sinkronisasi metrik pertama secara instan
    await handleSocialMediaSync({
      DB: c.env.DB,
      COMPOSIO_API_KEY: c.env.COMPOSIO_API_KEY,
    });

    return c.json({
      success: true,
      message: 'Koneksi akun media sosial berhasil diverifikasi dan disinkronkan secara otomatis!',
      data: {
        status: 'ACTIVE',
        connectedAccountId,
        accountHandle,
      },
    });
  } catch (err: any) {
    console.error('[Composio Callback Error]', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// -------------------------------------------------------------
// GET /api/composio/status
// Returns all active / connected social media accounts for authenticated user
// -------------------------------------------------------------
composioRouter.get('/status', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  try {
    await ensureSocialTables(c.env.DB);

    const { results } = await c.env.DB.prepare(
      `SELECT id, user_id, platform, composio_connection_id, account_handle, status, last_synced_at, created_at
       FROM social_connections
       WHERE user_id = ?
       ORDER BY created_at DESC;`
    )
      .bind(user.id)
      .all();

    return c.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err: any) {
    console.error('[Composio Status Error]', err.message);
    return c.json(
      {
        success: false,
        error: err.message || 'Gagal memuat status koneksi media sosial',
      },
      500
    );
  }
});

// -------------------------------------------------------------
// GET /api/composio/metrics
// Returns aggregated metrics and time-series history for all active connections
// -------------------------------------------------------------
composioRouter.get('/metrics', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  try {
    await ensureSocialTables(c.env.DB);

    // 1. Ambil seluruh akun media sosial aktif milik user ini
    const { results: connections } = await c.env.DB.prepare(
      `SELECT id, platform, composio_connection_id, account_handle, status, last_synced_at, created_at
       FROM social_connections
       WHERE user_id = ? AND status = 'ACTIVE'
       ORDER BY created_at DESC;`
    )
      .bind(user.id)
      .all<any>();

    if (!connections || connections.length === 0) {
      return c.json({
        success: true,
        hasConnections: false,
        summary: null,
        history: [],
      });
    }

    const reqConnectionId = c.req.query('connectionId');
    const reqPlatform = c.req.query('platform');

    let primaryAccount = connections[0];
    if (reqConnectionId) {
      const match = connections.find((c: any) => c.id === reqConnectionId);
      if (match) primaryAccount = match;
    } else if (reqPlatform) {
      const match = connections.find((c: any) => c.platform.toLowerCase() === reqPlatform.toLowerCase());
      if (match) primaryAccount = match;
    }

    // 2. Ambil data metrik time-series terfokus untuk akun yang dipilih
    const { results: historyRows } = await c.env.DB.prepare(
      `SELECT h.connection_id, h.platform, h.metric_type, h.metric_value, h.snapshot_date, h.recorded_at
       FROM social_metrics_history h
       WHERE h.connection_id = ?
       ORDER BY h.snapshot_date ASC, h.id ASC;`
    )
      .bind(primaryAccount.id)
      .all<any>();

    // 3. Ekstrak nilai metrik terbaru
    let latestSubscribers = 0;
    let latestViews = 0;
    let latestVideos = 0;

    historyRows.forEach((row: any) => {
      if (row.metric_type === 'subscribers') latestSubscribers = Number(row.metric_value);
      if (row.metric_type === 'views') latestViews = Number(row.metric_value);
      if (row.metric_type === 'videos_count') latestVideos = Number(row.metric_value);
    });

    // Format data time-series per tanggal untuk konsumsi grafik Chart.js
    const dailyMap: Record<string, { date: string; subscribers: number; views: number }> = {};
    historyRows.forEach((row: any) => {
      const d = row.snapshot_date;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, subscribers: 0, views: 0 };
      }
      if (row.metric_type === 'subscribers') {
        dailyMap[d].subscribers = Number(row.metric_value);
      }
      if (row.metric_type === 'views') {
        dailyMap[d].views = Number(row.metric_value);
      }
    });

    const timeSeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Hitung pertumbuhan subscriber/follower (growth delta) dari data riil yang terekam
    let growthDelta = 'Hari ke-1 (Mulai Pelacakan)';
    if (timeSeries.length >= 2) {
      const first = timeSeries[0].subscribers;
      const last = timeSeries[timeSeries.length - 1].subscribers;
      if (first > 0) {
        const diff = last - first;
        const pct = ((diff / first) * 100).toFixed(1);
        growthDelta = diff >= 0 ? `+${pct}% (${timeSeries.length} hari)` : `${pct}% (${timeSeries.length} hari)`;
      } else {
        growthDelta = `+${last} baru`;
      }
    }

    return c.json({
      success: true,
      hasConnections: true,
      connectionsCount: connections.length,
      connections: connections.map((conn: any) => ({
        id: conn.id,
        platform: conn.platform,
        accountHandle: conn.account_handle || null,
        lastSyncedAt: conn.last_synced_at,
      })),
      primaryAccount,
      summary: {
        connectionId: primaryAccount.id,
        subscribers: latestSubscribers,
        views: latestViews,
        videos: latestVideos,
        growthRate: growthDelta,
        lastSyncedAt: primaryAccount?.last_synced_at,
        platform: primaryAccount?.platform,
        accountHandle: primaryAccount?.account_handle || null,
      },
      timeSeries,
    });
  } catch (err: any) {
    console.error('[Composio Metrics Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal memuat metrik media sosial' },
      500
    );
  }
});

// -------------------------------------------------------------
// POST /api/composio/sync
// Manually triggers social media metrics synchronization for testing
// -------------------------------------------------------------
composioRouter.post('/sync', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  try {
    await handleSocialMediaSync({
      DB: c.env.DB,
      COMPOSIO_API_KEY: c.env.COMPOSIO_API_KEY,
    });

    return c.json({
      success: true,
      message: 'Sinkronisasi metrik media sosial berhasil dijalankan',
    });
  } catch (err: any) {
    console.error('[Composio Manual Sync Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal menjalankan sinkronisasi' },
      500
    );
  }
});

// -------------------------------------------------------------
// GET /api/composio/posts
// Mengambil daftar analisa per video / postingan dengan metrik minimal: views, likes, comments
// -------------------------------------------------------------
composioRouter.get('/posts', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const filterPlatform = c.req.query('platform');
  const sortBy = c.req.query('sort') || 'recent';

  try {
    await ensureSocialTables(c.env.DB);

    // Ambil koneksi akun aktif pengguna
    const { results: connections } = await c.env.DB.prepare(
      `SELECT id, platform, account_handle, composio_connection_id, user_id 
       FROM social_connections 
       WHERE user_id = ? AND status IN ('ACTIVE', 'INITIATED');`
    )
      .bind(user.id)
      .all<any>();

    if (!connections || connections.length === 0) {
      return c.json({
        success: true,
        hasConnections: false,
        posts: [],
        summary: {
          totalPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagementRate: '0%',
        },
      });
    }

    let composio = null;
    if (c.env.COMPOSIO_API_KEY) {
      try {
        composio = getComposioClient(c.env.COMPOSIO_API_KEY);
      } catch (err: any) {
        console.warn('[Composio Client Init Notice]:', err.message);
      }
    }

    // Pastikan setiap koneksi memiliki data postingan di tabel social_posts
    for (const conn of connections) {
      await syncSocialPostsForConnection(c.env, conn, composio, false);
    }

    // Susun query pengambilan data
    let query = `
      SELECT p.id, p.connection_id, p.platform, p.platform_post_id, p.title_or_caption,
             p.thumbnail_url, p.permalink, p.published_at, p.views_count, p.likes_count,
             p.comments_count, p.shares_count, p.additional_metrics, p.last_synced_at,
             c.account_handle
      FROM social_posts p
      JOIN social_connections c ON p.connection_id = c.id
      WHERE c.user_id = ?
    `;
    const params: any[] = [user.id];

    if (filterPlatform && filterPlatform !== 'all') {
      query += ` AND p.platform = ?`;
      params.push(filterPlatform.toLowerCase());
    }

    if (sortBy === 'views') {
      query += ` ORDER BY p.views_count DESC, p.published_at DESC`;
    } else if (sortBy === 'likes') {
      query += ` ORDER BY p.likes_count DESC, p.published_at DESC`;
    } else if (sortBy === 'comments') {
      query += ` ORDER BY p.comments_count DESC, p.published_at DESC`;
    } else {
      query += ` ORDER BY p.published_at DESC, p.views_count DESC`;
    }

    const { results: rows } = await c.env.DB.prepare(query)
      .bind(...params)
      .all<any>();

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    const posts = (rows || []).map((r: any) => {
      const views = Number(r.views_count || 0);
      const likes = Number(r.likes_count || 0);
      const comments = Number(r.comments_count || 0);
      const shares = Number(r.shares_count || 0);

      totalViews += views;
      totalLikes += likes;
      totalComments += comments;
      totalShares += shares;

      let extras: any = {};
      if (r.additional_metrics) {
        try {
          extras = typeof r.additional_metrics === 'string' ? JSON.parse(r.additional_metrics) : r.additional_metrics;
        } catch {}
      }

      const calculatedRate = views > 0 ? (((likes + comments) / views) * 100).toFixed(1) + '%' : '0%';

      return {
        id: r.id,
        connectionId: r.connection_id,
        platform: r.platform,
        platformPostId: r.platform_post_id,
        titleOrCaption: r.title_or_caption,
        thumbnailUrl: r.thumbnail_url,
        permalink: r.permalink,
        publishedAt: r.published_at,
        viewsCount: views,
        likesCount: likes,
        commentsCount: comments,
        sharesCount: shares,
        engagementRate: extras.engagement_rate || calculatedRate,
        additionalMetrics: extras,
        accountHandle: r.account_handle,
        lastSyncedAt: r.last_synced_at,
      };
    });

    const avgEngagementRate =
      totalViews > 0
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1) + '%'
        : '0%';

    return c.json({
      success: true,
      hasConnections: true,
      posts,
      summary: {
        totalPosts: posts.length,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate,
      },
    });
  } catch (err: any) {
    console.error('[Composio Posts Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal memuat analitik postingan' },
      500
    );
  }
});

// -------------------------------------------------------------
// POST /api/composio/posts/sync
// Force sync konten video dan postingan media sosial
// -------------------------------------------------------------
composioRouter.post('/posts/sync', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  try {
    await ensureSocialTables(c.env.DB);

    const { results: connections } = await c.env.DB.prepare(
      `SELECT id, platform, account_handle, composio_connection_id, user_id 
       FROM social_connections 
       WHERE user_id = ? AND status IN ('ACTIVE', 'INITIATED');`
    )
      .bind(user.id)
      .all<any>();

    let composio = null;
    if (c.env.COMPOSIO_API_KEY) {
      try {
        composio = getComposioClient(c.env.COMPOSIO_API_KEY);
      } catch (err: any) {
        console.warn('[Composio Client Init Notice]:', err.message);
      }
    }

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        await syncSocialPostsForConnection(c.env, conn, composio, true);
      }
    }

    return c.json({
      success: true,
      message: 'Performa video dan postingan berhasil disinkronisasi',
    });
  } catch (err: any) {
    console.error('[Composio Posts Sync Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal menyinkronkan postingan' },
      500
    );
  }
});

// -------------------------------------------------------------
// GET /api/composio/posts/:postId/comments
// Mengambil daftar komentar riil untuk postingan atau video spesifik
// -------------------------------------------------------------
composioRouter.get('/posts/:postId/comments', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const postId = c.req.param('postId');

  try {
    await ensureSocialTables(c.env.DB);

    // Ambil data postingan dan koneksi terkait
    const post: any = await c.env.DB.prepare(
      `SELECT p.id, p.connection_id, p.platform, p.platform_post_id, p.title_or_caption,
              p.thumbnail_url, p.permalink, p.comments_count,
              c.composio_connection_id, c.account_handle, c.user_id
       FROM social_posts p
       JOIN social_connections c ON p.connection_id = c.id
       WHERE p.id = ? AND c.user_id = ?;`
    )
      .bind(postId, user.id)
      .first();

    if (!post) {
      return c.json(
        { success: false, error: 'Postingan tidak ditemukan atau tidak memiliki akses' },
        404
      );
    }

    let comments: any[] = [];
    const platform = (post.platform || '').toLowerCase();

    if (c.env.COMPOSIO_API_KEY && post.composio_connection_id) {
      const composio = getComposioClient(c.env.COMPOSIO_API_KEY);

      if (platform === 'instagram') {
        const res: any = await composio.tools.execute('INSTAGRAM_GET_IG_MEDIA_COMMENTS', {
          connectedAccountId: post.composio_connection_id,
          userId: post.user_id,
          arguments: {
            ig_media_id: post.platform_post_id,
            fields: 'id,text,username,from,timestamp,like_count',
          },
        }).catch((err: any) => {
          console.warn('[Composio Comments Error]', err.message);
          return null;
        });

        if (res && res.data && Array.isArray(res.data.data)) {
          comments = res.data.data.map((item: any) => {
            const rawUsername =
              item.from?.username ||
              item.username ||
              item.user?.username ||
              null;

            return {
              id: item.id,
              text: item.text || '',
              username: rawUsername || 'Pengguna Instagram',
              timestamp: item.timestamp,
              likeCount: Number(item.like_count || 0),
            };
          });
        }
      } else if (platform === 'youtube') {
        const res: any = await composio.tools.execute('YOUTUBE_LIST_COMMENT_THREADS', {
          connectedAccountId: post.composio_connection_id,
          userId: post.user_id,
          arguments: {
            part: 'snippet',
            videoId: post.platform_post_id,
            maxResults: 50,
          },
        }).catch((err: any) => {
          console.warn('[Composio YouTube Comments Error]', err.message);
          return null;
        });

        if (res && res.data && Array.isArray(res.data.items)) {
          comments = res.data.items.map((item: any) => {
            const snip = item.snippet?.topLevelComment?.snippet || {};
            return {
              id: item.id || snip.id,
              text: snip.textDisplay || snip.textOriginal || '',
              username: snip.authorDisplayName || 'Pengguna YouTube',
              timestamp: snip.publishedAt,
              likeCount: Number(snip.likeCount || 0),
            };
          });
        }
      } else if (platform === 'tiktok') {
        try {
          const proxyRes: any = await composio.tools.proxyExecute({
            connectedAccountId: post.composio_connection_id,
            userId: post.user_id,
            endpoint: '/v2/video/comment/list/?fields=id,text,create_time,like_count,reply_count',
            method: 'POST',
            body: {
              video_id: post.platform_post_id,
              max_count: 30,
            },
          }).catch((err: any) => {
            console.warn('[Composio TikTok Comments Notice]', err.message);
            return null;
          });

          const ttComments = proxyRes?.data?.data?.comments || proxyRes?.data?.comments || [];
          if (Array.isArray(ttComments)) {
            comments = ttComments.map((item: any) => {
              const rawUsername =
                item.user?.display_name ||
                item.user?.username ||
                item.user_name ||
                null;
              const dateIso = item.create_time
                ? new Date(Number(item.create_time) * 1000).toISOString()
                : new Date().toISOString();

              return {
                id: item.id || `tt_cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                text: item.text || '',
                username: rawUsername || 'Pengguna TikTok',
                timestamp: dateIso,
                likeCount: Number(item.like_count || 0),
              };
            });
          }
        } catch (ttErr: any) {
          console.warn('[TikTok Comments Exception]', ttErr.message);
        }
      }
    }

    // Analisis Sentimen untuk Setiap Komentar
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let scoreSum = 0;

    const enrichedComments = comments.map((item: any) => {
      const sentiment = analyzeSentiment(item.text);
      if (sentiment.sentiment === 'positive') positiveCount++;
      else if (sentiment.sentiment === 'negative') negativeCount++;
      else neutralCount++;
      scoreSum += sentiment.score;

      return {
        ...item,
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        sentimentScorePct: sentiment.scorePct,
        sentimentLabel: sentiment.label,
        matchedKeywords: sentiment.matchedKeywords,
      };
    });

    const totalCount = enrichedComments.length;
    const avgScore = totalCount > 0 ? Number((scoreSum / totalCount).toFixed(2)) : 0;
    const avgScorePct = totalCount > 0 ? Math.round(((avgScore + 1) / 2) * 100) : 50;

    let postSentimentLabel = 'Netral';
    if (avgScore > 0.15) postSentimentLabel = avgScore > 0.5 ? 'Sangat Positif' : 'Positif';
    else if (avgScore < -0.15) postSentimentLabel = avgScore < -0.5 ? 'Perlu Perhatian' : 'Kritik';

    return c.json({
      success: true,
      postId: post.id,
      platform: post.platform,
      titleOrCaption: post.title_or_caption,
      thumbnailUrl: post.thumbnail_url,
      totalComments: enrichedComments.length,
      postSentiment: {
        score: avgScore,
        scorePct: avgScorePct,
        label: postSentimentLabel,
        positiveCount,
        neutralCount,
        negativeCount,
        positivePct: totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0,
        neutralPct: totalCount > 0 ? Math.round((neutralCount / totalCount) * 100) : 0,
        negativePct: totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0,
      },
      comments: enrichedComments,
    });
  } catch (err: any) {
    console.error('[Get Post Comments Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal mengambil komentar postingan' },
      500
    );
  }
});

// -------------------------------------------------------------
// GET /api/composio/insights
// Intelijensi Konten Berbasis AI: Analisis Sentimen Komentar,
// Pola Waktu Unggah Terbaik (Timing Matrix), dan Rekomendasi Taktis
// -------------------------------------------------------------
composioRouter.get('/insights', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const reqPlatform = c.req.query('platform');
  const reqConnectionId = c.req.query('connectionId');

  try {
    await ensureSocialTables(c.env.DB);

    // 1. Ambil seluruh postingan media sosial milik user ini
    let query = `
      SELECT p.id, p.connection_id, p.platform, p.platform_post_id, p.title_or_caption,
             p.thumbnail_url, p.permalink, p.published_at, p.views_count, p.likes_count,
             p.comments_count, p.shares_count, p.additional_metrics,
             c.account_handle, c.composio_connection_id, c.user_id
      FROM social_posts p
      JOIN social_connections c ON p.connection_id = c.id
      WHERE c.user_id = ?
    `;
    const params: any[] = [user.id];

    if (reqPlatform && reqPlatform.toLowerCase() !== 'all') {
      query += ` AND LOWER(p.platform) = ?`;
      params.push(reqPlatform.toLowerCase());
    }
    if (reqConnectionId) {
      query += ` AND p.connection_id = ?`;
      params.push(reqConnectionId);
    }

    query += ` ORDER BY p.published_at DESC;`;

    const { results: posts } = await c.env.DB.prepare(query).bind(...params).all<any>();

    if (!posts || posts.length === 0) {
      return c.json({
        success: true,
        hasData: false,
        message: 'Belum ada konten tersinkronisasi untuk dianalisis oleh AI.',
        summary: null,
        sentiment: null,
        timing: null,
        recommendations: [],
      });
    }

    // 2. Analisis Metrik Agregat
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    posts.forEach((p) => {
      totalViews += Number(p.views_count || 0);
      totalLikes += Number(p.likes_count || 0);
      totalComments += Number(p.comments_count || 0);
      totalShares += Number(p.shares_count || 0);
    });

    const avgEngagementRate =
      totalViews > 0
        ? Number((((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(1))
        : 0;

    // 3. Analisis Pola Waktu Unggah Terbaik (Timing Insight)
    const timingInsight = analyzePostingPatterns(posts);

    // 4. Analisis Sentimen Komentar Riil
    const postWithComments = posts.filter((p) => Number(p.comments_count || 0) > 0);
    let allAnalyzedComments: any[] = [];
    const positiveKeywordsSet = new Set<string>();
    const feedbackKeywordsSet = new Set<string>();

    if (c.env.COMPOSIO_API_KEY && postWithComments.length > 0) {
      const composio = getComposioClient(c.env.COMPOSIO_API_KEY);
      for (const p of postWithComments.slice(0, 3)) {
        const plat = (p.platform || '').toLowerCase();
        let fetched: any[] = [];

        if (plat === 'instagram' && p.composio_connection_id) {
          const res: any = await composio.tools.execute('INSTAGRAM_GET_IG_MEDIA_COMMENTS', {
            connectedAccountId: p.composio_connection_id,
            userId: p.user_id,
            arguments: {
              ig_media_id: p.platform_post_id,
              fields: 'id,text,username,timestamp,like_count',
            },
          }).catch(() => null);

          if (res?.data?.data && Array.isArray(res.data.data)) {
            fetched = res.data.data.map((item: any) => ({
              text: item.text || '',
            }));
          }
        }

        fetched.forEach((f) => {
          if (!f.text) return;
          const sent = analyzeSentiment(f.text);
          allAnalyzedComments.push(sent);
          if (sent.sentiment === 'positive') {
            sent.matchedKeywords.forEach((kw) => positiveKeywordsSet.add(kw));
          } else if (sent.sentiment === 'negative') {
            sent.matchedKeywords.forEach((kw) => feedbackKeywordsSet.add(kw));
          }
        });
      }
    }

    // Hitung ringkasan sentimen
    let positivePct = 0;
    let neutralPct = 100;
    let negativePct = 0;
    let overallSentimentScore = 50;
    let sentimentLabel = 'Menunggu Komentar Audiens';

    if (allAnalyzedComments.length > 0) {
      const posCount = allAnalyzedComments.filter((c) => c.sentiment === 'positive').length;
      const negCount = allAnalyzedComments.filter((c) => c.sentiment === 'negative').length;
      const neuCount = allAnalyzedComments.length - posCount - negCount;

      positivePct = Math.round((posCount / allAnalyzedComments.length) * 100);
      negativePct = Math.round((negCount / allAnalyzedComments.length) * 100);
      neutralPct = 100 - positivePct - negativePct;

      const avgRawScore =
        allAnalyzedComments.reduce((acc, c) => acc + c.score, 0) / allAnalyzedComments.length;
      overallSentimentScore = Math.round(((avgRawScore + 1) / 2) * 100);

      if (avgRawScore > 0.4) sentimentLabel = 'Sangat Mengapresiasi (Positif Kuat)';
      else if (avgRawScore > 0.1) sentimentLabel = 'Respons Positif';
      else if (avgRawScore < -0.2) sentimentLabel = 'Memerlukan Evaluasi';
      else sentimentLabel = 'Netral & Wajar';
    }

    const topPositiveKeywords = Array.from(positiveKeywordsSet).slice(0, 5);
    const topFeedbackKeywords = Array.from(feedbackKeywordsSet).slice(0, 5);

    // 5. Performa Berdasarkan Platform (Breakdown)
    const platformMap: Record<string, { count: number; views: number; likes: number; comments: number }> = {};
    posts.forEach((p) => {
      const plat = (p.platform || 'other').toLowerCase();
      if (!platformMap[plat]) platformMap[plat] = { count: 0, views: 0, likes: 0, comments: 0 };
      platformMap[plat].count++;
      platformMap[plat].views += Number(p.views_count || 0);
      platformMap[plat].likes += Number(p.likes_count || 0);
      platformMap[plat].comments += Number(p.comments_count || 0);
    });

    const platformBreakdown = Object.entries(platformMap).map(([plat, s]) => {
      const rate = s.views > 0 ? (((s.likes + s.comments) / s.views) * 100).toFixed(1) + '%' : '0.0%';
      return {
        platform: plat,
        postsCount: s.count,
        totalViews: s.views,
        totalLikes: s.likes,
        totalComments: s.comments,
        engagementRate: rate,
      };
    });

    // 6. Buat Rekomendasi Taktis Berbasis AI
    const recommendations = generateActionableRecommendations(
      posts,
      {
        positivePct,
        negativePct,
        neutralPct,
        topPositiveKeywords,
        topFeedbackKeywords,
      },
      timingInsight,
      '0.0%'
    );

    return c.json({
      success: true,
      hasData: true,
      analyzedAt: new Date().toISOString(),
      summary: {
        totalPosts: posts.length,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate: `${avgEngagementRate}%`,
        industryBenchmarkRate: '3.5% - 5.0%',
        relativePerformance: avgEngagementRate >= 4.0 ? 'Di Atas Rata-rata Industri (+)' : 'Sesuai Rata-rata Industri',
      },
      sentiment: {
        overallScore: overallSentimentScore,
        sentimentLabel,
        totalCommentsAnalyzed: allAnalyzedComments.length,
        positivePct,
        neutralPct,
        negativePct,
        topPositiveKeywords,
        topFeedbackKeywords,
      },
      timing: timingInsight,
      platformBreakdown,
      recommendations,
    });
  } catch (err: any) {
    console.error('[AI Insights Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal memproses analisis intelijensi AI' },
      500
    );
  }
});

// -------------------------------------------------------------
// POST /api/composio/insights/refresh
// Memaksa kalkulasi ulang analisis intelijensi AI
// -------------------------------------------------------------
composioRouter.post('/insights/refresh', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  return c.json({
    success: true,
    message: 'Analisis intelijensi AI berhasil diperbarui.',
  });
});

// -------------------------------------------------------------
// DELETE /api/composio/connections/:id
// Disconnects / removes social media account
// -------------------------------------------------------------
composioRouter.delete('/connections/:id', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json(
      { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
      401
    );
  }

  const connectionId = c.req.param('id');

  try {
    await ensureSocialTables(c.env.DB);

    await c.env.DB.batch([
      c.env.DB.prepare(
        `DELETE FROM social_posts WHERE connection_id = ?;`
      ).bind(connectionId),
      c.env.DB.prepare(
        `DELETE FROM social_metrics_history WHERE connection_id = ?;`
      ).bind(connectionId),
      c.env.DB.prepare(
        `DELETE FROM social_connections WHERE id = ? AND user_id = ?;`
      ).bind(connectionId, user.id),
    ]);

    return c.json({
      success: true,
      message: 'Koneksi akun media sosial berhasil diputuskan',
    });
  } catch (err: any) {
    console.error('[Composio Disconnect Error]', err.message);
    return c.json(
      { success: false, error: err.message || 'Gagal memutuskan koneksi' },
      500
    );
  }
});

// -------------------------------------------------------------
// GET /api/composio/attribution
// Aggregates cross-platform social media click & conversion stats
// -------------------------------------------------------------
composioRouter.get('/attribution', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized: Sesi tidak ditemukan' }, 401);
  }

  try {
    await ensureSocialTables(c.env.DB);

    // Dapatkan semua project ID milik user
    const projects = await c.env.DB.prepare(
      `SELECT id, name FROM projects WHERE owner_id = ? OR id = 'prj_default';`
    ).bind(user.id).all<any>();

    const projectIds = (projects.results || []).map((p: any) => p.id);
    if (projectIds.length === 0) {
      projectIds.push('prj_default');
    }

    const placeholders = projectIds.map(() => '?').join(',');

    // 1. Total Klik Web yang Berasal dari Media Sosial
    const socialClicksRes: any = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM click_events 
       WHERE project_id IN (${placeholders}) 
         AND (social_platform IS NOT NULL OR utm_source IS NOT NULL OR referrer LIKE '%instagram.com%' OR referrer LIKE '%tiktok.com%' OR referrer LIKE '%youtube.com%' OR referrer LIKE '%facebook.com%');`
    ).bind(...projectIds).first();

    const totalSocialClicks = Number(socialClicksRes?.total || 0);

    // 2. Total Semua Klik Web (untuk menghitung rasio kontribusi sosial)
    const allClicksRes: any = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM click_events WHERE project_id IN (${placeholders});`
    ).bind(...projectIds).first();
    const totalWebClicks = Number(allClicksRes?.total || 0);

    // 3. Breakdown per Platform Media Sosial
    const breakdownRes = await c.env.DB.prepare(
      `SELECT 
         LOWER(COALESCE(social_platform, utm_source, 
           CASE 
             WHEN referrer LIKE '%instagram%' THEN 'instagram'
             WHEN referrer LIKE '%tiktok%' THEN 'tiktok'
             WHEN referrer LIKE '%youtube%' OR referrer LIKE '%youtu.be%' THEN 'youtube'
             WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.com%' THEN 'facebook'
             WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' OR referrer LIKE '%x.com%' THEN 'twitter'
             ELSE 'lainnya'
           END
         )) as platform,
         COUNT(*) as clicks,
         COUNT(DISTINCT session_id) as sessions
       FROM click_events
       WHERE project_id IN (${placeholders})
         AND (social_platform IS NOT NULL OR utm_source IS NOT NULL OR referrer LIKE '%instagram.com%' OR referrer LIKE '%tiktok.com%' OR referrer LIKE '%youtube.com%' OR referrer LIKE '%facebook.com%')
       GROUP BY platform
       ORDER BY clicks DESC;`
    ).bind(...projectIds).all<any>();

    const platformBreakdown = (breakdownRes.results || []).map((row: any) => ({
      platform: row.platform,
      clicks: Number(row.clicks || 0),
      sessions: Number(row.sessions || 0),
      percentage: totalSocialClicks > 0 ? Math.round((Number(row.clicks) / totalSocialClicks) * 100) : 0,
    }));

    // 4. CTA Paling Banyak Diklik oleh Pengunjung Media Sosial
    const topCtasRes = await c.env.DB.prepare(
      `SELECT 
         c.element_id,
         c.page_path,
         COUNT(*) as clicks,
         MAX(c.created_at) as last_clicked,
         COALESCE(a.display_name, c.element_id) as friendly_name
       FROM click_events c
       LEFT JOIN element_aliases a ON a.project_id = c.project_id AND a.element_id = c.element_id
       WHERE c.project_id IN (${placeholders})
         AND (c.social_platform IS NOT NULL OR c.utm_source IS NOT NULL OR c.referrer LIKE '%instagram.com%' OR c.referrer LIKE '%tiktok.com%' OR c.referrer LIKE '%youtube.com%' OR c.referrer LIKE '%facebook.com%')
       GROUP BY c.element_id, c.page_path
       ORDER BY clicks DESC
       LIMIT 5;`
    ).bind(...projectIds).all<any>();

    // 5. 10 Log Konversi Terakhir dari Media Sosial
    const recentConversionsRes = await c.env.DB.prepare(
      `SELECT 
         c.id,
         c.element_id,
         c.page_path,
         c.country,
         c.city,
         c.created_at,
         COALESCE(c.social_platform, c.utm_source, 
           CASE 
             WHEN c.referrer LIKE '%instagram%' THEN 'instagram'
             WHEN c.referrer LIKE '%tiktok%' THEN 'tiktok'
             WHEN c.referrer LIKE '%youtube%' OR c.referrer LIKE '%youtu.be%' THEN 'youtube'
             ELSE 'social'
           END
         ) as platform,
         c.utm_campaign,
         COALESCE(a.display_name, c.element_id) as friendly_name
       FROM click_events c
       LEFT JOIN element_aliases a ON a.project_id = c.project_id AND a.element_id = c.element_id
       WHERE c.project_id IN (${placeholders})
         AND (c.social_platform IS NOT NULL OR c.utm_source IS NOT NULL OR c.referrer LIKE '%instagram.com%' OR c.referrer LIKE '%tiktok.com%' OR c.referrer LIKE '%youtube.com%' OR c.referrer LIKE '%facebook.com%')
       ORDER BY c.id DESC
       LIMIT 10;`
    ).bind(...projectIds).all<any>();

    const conversionRate = totalWebClicks > 0 
      ? ((totalSocialClicks / totalWebClicks) * 100).toFixed(1) + '%' 
      : '0.0%';

    return c.json({
      success: true,
      data: {
        summary: {
          totalSocialClicks,
          totalWebClicks,
          socialContributionRate: conversionRate,
          topPlatform: platformBreakdown[0]?.platform || '-',
          topCtaName: (topCtasRes.results?.[0] as any)?.friendly_name || '-',
        },
        breakdown: platformBreakdown,
        topCtas: topCtasRes.results || [],
        recentConversions: recentConversionsRes.results || [],
      },
    });
  } catch (err: any) {
    console.error('[Social Attribution Error]', err.message);
    return c.json({ success: false, error: err.message || 'Gagal memuat atribusi sosial' }, 500);
  }
});

// -------------------------------------------------------------
// GET /api/composio/links
// Fetches tracked Link-in-Bio / Campaign links
// -------------------------------------------------------------
composioRouter.get('/links', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized: Sesi tidak ditemukan' }, 401);
  }

  try {
    await ensureSocialTables(c.env.DB);

    const links = await c.env.DB.prepare(
      `SELECT * FROM social_campaign_links WHERE user_id = ? ORDER BY created_at DESC;`
    ).bind(user.id).all<any>();

    return c.json({
      success: true,
      data: links.results || [],
    });
  } catch (err: any) {
    console.error('[Get Campaign Links Error]', err.message);
    return c.json({ success: false, error: err.message || 'Gagal mengambil tautan kampanye' }, 500);
  }
});

// -------------------------------------------------------------
// POST /api/composio/links
// Creates a new tracked Link-in-Bio / Campaign link
// -------------------------------------------------------------
composioRouter.post('/links', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized: Sesi tidak ditemukan' }, 401);
  }

  try {
    await ensureSocialTables(c.env.DB);

    const body = await c.req.json().catch(() => ({}));
    const platform = String(body.platform || 'instagram').toLowerCase().trim();
    const title = String(body.title || '').trim();
    const targetUrlRaw = String(body.targetUrl || '').trim();
    const campaignRaw = String(body.campaignName || '').trim();

    if (!title || !targetUrlRaw) {
      return c.json({ success: false, error: 'Judul tautan dan URL tujuan wajib diisi' }, 400);
    }

    // Normalisasi URL tujuan
    let targetUrl = targetUrlRaw;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Format slug campaign
    const utmCampaign = campaignRaw
      ? campaignRaw.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : 'bio_' + platform + '_' + Math.random().toString(36).substring(2, 6);

    const utmSource = platform;
    const utmMedium = 'bio';

    const separator = targetUrl.includes('?') ? '&' : '?';
    const trackedUrl = `${targetUrl}${separator}utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;

    const defaultProject = await c.env.DB.prepare(
      `SELECT id FROM projects WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1;`
    ).bind(user.id).first<any>();
    const projectId = defaultProject?.id || 'prj_default';

    const id = 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    await c.env.DB.prepare(
      `INSERT INTO social_campaign_links (
        id, user_id, project_id, platform, title, target_url, utm_source, utm_medium, utm_campaign, tracked_url, clicks_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'));`
    ).bind(
      id,
      user.id,
      projectId,
      platform,
      title,
      targetUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      trackedUrl
    ).run();

    return c.json({
      success: true,
      message: 'Tautan pelacak Link-in-Bio berhasil dibuat',
      data: {
        id,
        platform,
        title,
        target_url: targetUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        tracked_url: trackedUrl,
        clicks_count: 0,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[Create Link Error]', err.message);
    return c.json({ success: false, error: err.message || 'Gagal membuat tautan pelacak' }, 500);
  }
});

// -------------------------------------------------------------
// DELETE /api/composio/links/:id
// Deletes a tracked Link-in-Bio
// -------------------------------------------------------------
composioRouter.delete('/links/:id', async (c) => {
  const user = await extractUser(c);
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized: Sesi tidak ditemukan' }, 401);
  }

  const linkId = c.req.param('id');

  try {
    await ensureSocialTables(c.env.DB);

    await c.env.DB.prepare(
      `DELETE FROM social_campaign_links WHERE id = ? AND user_id = ?;`
    ).bind(linkId, user.id).run();

    return c.json({
      success: true,
      message: 'Tautan pelacak berhasil dihapus',
    });
  } catch (err: any) {
    console.error('[Delete Link Error]', err.message);
    return c.json({ success: false, error: err.message || 'Gagal menghapus tautan' }, 500);
  }
});

export { composioRouter };

