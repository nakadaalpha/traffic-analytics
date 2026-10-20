-- Migration skema SQLite untuk Cloudflare D1
-- Tabel projects: Registrasi project, public write keys, dan allowed origins (disimpan sebagai JSON text)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_write_key TEXT UNIQUE NOT NULL,
    allowed_origins TEXT DEFAULT '["http://localhost:3000","http://127.0.0.1:3000"]',
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Default project untuk demo lokal & live testing
INSERT OR IGNORE INTO projects (id, name, public_write_key, allowed_origins, is_active)
VALUES (
    'prj_default', 
    'Default Web Project', 
    'pk_live_demo12345', 
    '["http://localhost:3000","http://127.0.0.1:3000"]', 
    1
);

-- Tabel click_events: Raw tracking log
CREATE TABLE IF NOT EXISTS click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT DEFAULT 'prj_default' NOT NULL,
    element_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id INTEGER,
    user_agent TEXT,
    ip_address TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_click_events_project_time 
    ON click_events (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_project_element 
    ON click_events (project_id, element_id, page_path);

-- Tabel cta_metrics: Ringkasan agregasi klik atomic
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
