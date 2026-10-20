-- 002_multi_project_security.sql
-- Migration: Add multi-project tenancy, project isolation, and security controls

-- 1. Tabel projects: Mengelola data registrasi project/klien, write-keys, dan domain whitelist
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    public_write_key VARCHAR(100) UNIQUE NOT NULL,
    allowed_origins TEXT[] DEFAULT ARRAY['http://localhost:3000'],
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Masukkan default project untuk demo/lokal jika belum ada
INSERT INTO projects (id, name, public_write_key, allowed_origins, is_active)
VALUES (
    'prj_default', 
    'Default Web Project', 
    'pk_live_demo12345', 
    ARRAY['http://localhost:3000', 'http://127.0.0.1:3000'], 
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Update tabel click_events untuk isolasi multi-tenant
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'click_events' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE click_events ADD COLUMN project_id VARCHAR(50) DEFAULT 'prj_default' NOT NULL;
        ALTER TABLE click_events ADD CONSTRAINT fk_click_events_project 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_click_events_project_time 
    ON click_events (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_project_element 
    ON click_events (project_id, element_id, page_path);

-- 3. Update tabel cta_metrics dengan Composite Primary Key baru (project_id, element_id, page_path)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cta_metrics' AND column_name = 'project_id'
    ) THEN
        -- Hapus primary key lama jika ada
        ALTER TABLE cta_metrics DROP CONSTRAINT IF EXISTS cta_metrics_pkey;
        ALTER TABLE cta_metrics ADD COLUMN project_id VARCHAR(50) DEFAULT 'prj_default' NOT NULL;
        ALTER TABLE cta_metrics ADD PRIMARY KEY (project_id, element_id, page_path);
        ALTER TABLE cta_metrics ADD CONSTRAINT fk_cta_metrics_project 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;
