-- Migration skema SQLite untuk Cloudflare D1

-- 1. Tabel users: Mengelola akun admin/pengelola project
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- 2. Tabel projects: Registrasi project, public write keys, dan allowed origins (disimpan sebagai JSON text)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_write_key TEXT UNIQUE NOT NULL,
    allowed_origins TEXT DEFAULT '["http://localhost:3000"]',
    is_active INTEGER DEFAULT 1 NOT NULL,
    owner_id TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Default project untuk demo lokal & live testing
INSERT OR IGNORE INTO projects (id, name, public_write_key, allowed_origins, is_active)
VALUES (
    'prj_default', 
    'Default Web Project', 
    'pk_live_demo12345', 
    '["https://firenalytics.vercel.app","http://localhost:3000"]', 
    1
);

-- 2b. Tabel project_members: Mengelola hak akses kolaborasi tim (RBAC) pada tiap project/workspace
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' NOT NULL, -- 'owner', 'editor', 'viewer'
    invited_by TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);

-- 3. Tabel click_events: Raw tracking log
CREATE TABLE IF NOT EXISTS click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT DEFAULT 'prj_default' NOT NULL,
    element_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id INTEGER,
    user_agent TEXT,
    ip_address TEXT NOT NULL,
    country TEXT DEFAULT 'ID',
    city TEXT DEFAULT 'Unknown',
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    social_platform TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_click_events_project_time 
    ON click_events (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_project_element 
    ON click_events (project_id, element_id, page_path);

CREATE INDEX IF NOT EXISTS idx_click_events_social 
    ON click_events (project_id, social_platform, created_at DESC);

-- 4. Tabel cta_metrics: Ringkasan agregasi klik atomic
CREATE TABLE IF NOT EXISTS cta_metrics (
    project_id TEXT NOT NULL,
    element_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    total_clicks INTEGER DEFAULT 0 NOT NULL,
    last_clicked_at TEXT DEFAULT (datetime('now')) NOT NULL,
    PRIMARY KEY (project_id, element_id, page_path),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cta_metrics_clicks 
    ON cta_metrics (project_id, total_clicks DESC);

-- 5. Tabel element_aliases: Menyimpan label kustom / friendly display name untuk button/elemen CTA
CREATE TABLE IF NOT EXISTS element_aliases (
    project_id TEXT NOT NULL,
    element_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
    PRIMARY KEY (project_id, element_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_element_aliases_project 
    ON element_aliases (project_id);

-- 6. Tabel project_api_keys: Mengelola Secret API Key untuk konsumsi API eksternal
CREATE TABLE IF NOT EXISTS project_api_keys (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    name TEXT DEFAULT 'Default Secret Key' NOT NULL,
    scopes TEXT DEFAULT '["metrics:read"]' NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    last_used_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON project_api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_project ON project_api_keys (project_id);

-- 7. Tabel social_connections: Menyimpan akun medsos (YouTube, Twitter/X, Instagram, dll) yang terhubung via Composio
CREATE TABLE IF NOT EXISTS social_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    platform TEXT NOT NULL, -- 'youtube', 'tiktok', 'instagram', 'twitter', dll
    account_label TEXT DEFAULT 'Akun Utama',
    composio_connection_id TEXT NOT NULL,
    account_handle TEXT,
    status TEXT DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE', 'EXPIRED', 'REVOKED'
    last_synced_at TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_social_conn_user ON social_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_social_conn_platform ON social_connections (platform);
CREATE INDEX IF NOT EXISTS idx_social_conn_project ON social_connections (project_id, platform);

-- 8. Tabel social_metrics_history: Log metrik berkala (daily time-series snapshot data) untuk visualisasi tren analitik
CREATE TABLE IF NOT EXISTS social_metrics_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'followers', 'subscribers', 'views', 'posts_count'
    metric_value REAL NOT NULL,
    snapshot_date TEXT NOT NULL, -- 'YYYY-MM-DD'
    raw_payload TEXT, -- JSON response data snapshot dari Composio
    recorded_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (connection_id) REFERENCES social_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_social_metrics_conn_time 
    ON social_metrics_history (connection_id, recorded_at DESC);

-- 9. Tabel social_posts: Menyimpan analitik performa per video / postingan (YouTube, X, Instagram, Facebook, Threads, dll)
CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'youtube', 'twitter', 'instagram', 'facebook', 'threads', 'github'
    platform_post_id TEXT NOT NULL,
    title_or_caption TEXT,
    thumbnail_url TEXT,
    permalink TEXT,
    published_at TEXT,
    views_count REAL DEFAULT 0,
    likes_count REAL DEFAULT 0,
    comments_count REAL DEFAULT 0,
    shares_count REAL DEFAULT 0,
    additional_metrics TEXT, -- JSON format: { engagement_rate, retweets, saves, media_type, duration }
    last_synced_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (connection_id) REFERENCES social_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_social_posts_conn ON social_posts (connection_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts (platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts (published_at DESC);

-- 10. Tabel social_campaign_links: Generator & pelacak Link-in-Bio / kampanye media sosial
CREATE TABLE IF NOT EXISTS social_campaign_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'custom'
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

CREATE INDEX IF NOT EXISTS idx_social_links_user ON social_campaign_links (user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_project ON social_campaign_links (project_id);
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_campaign_links (platform);



