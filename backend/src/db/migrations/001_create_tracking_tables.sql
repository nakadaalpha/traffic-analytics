-- 001_create_tracking_tables.sql
-- Migration: Create click_events and cta_metrics tables for Custom Click & CTA Tracking Tool

-- 1. Tabel click_events: Mencatat setiap event klik mentah secara granular
CREATE TABLE IF NOT EXISTS click_events (
    id BIGSERIAL PRIMARY KEY,
    element_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id INT NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pada (element_id, page_path) untuk filtering query performa tinggi
CREATE INDEX IF NOT EXISTS idx_click_events_element_page 
    ON click_events (element_id, page_path);

-- Index pada (created_at) untuk query time-range/timeseries analytics
CREATE INDEX IF NOT EXISTS idx_click_events_created_at 
    ON click_events (created_at);

-- 2. Tabel cta_metrics: Tabel agregasi cepat (Atomic UPSERT)
CREATE TABLE IF NOT EXISTS cta_metrics (
    element_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    total_clicks BIGINT DEFAULT 0 NOT NULL,
    last_clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (element_id, page_path)
);
