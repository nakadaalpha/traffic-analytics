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
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_click_events_project_time 
    ON click_events (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_project_element 
    ON click_events (project_id, element_id, page_path);

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


