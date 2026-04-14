BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- Legacy table (tetap dipertahankan untuk kompatibilitas kode lama)
-- =============================================
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_content_updated_at
  ON site_content (updated_at DESC);

-- =============================================
-- New normalized schema per fitur
-- =============================================

CREATE TABLE IF NOT EXISTS home_content (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  badge TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  hero_image TEXT NOT NULL DEFAULT '',
  hero_image_alt TEXT NOT NULL DEFAULT '',
  primary_cta_text TEXT NOT NULL DEFAULT '',
  secondary_cta_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT home_singleton CHECK (singleton_id)
);

CREATE TABLE IF NOT EXISTS about_content (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  section_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  image_primary TEXT NOT NULL DEFAULT '',
  image_primary_alt TEXT NOT NULL DEFAULT '',
  image_secondary TEXT NOT NULL DEFAULT '',
  image_secondary_alt TEXT NOT NULL DEFAULT '',
  description_one TEXT NOT NULL DEFAULT '',
  description_two TEXT NOT NULL DEFAULT '',
  experience_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  experience_value TEXT NOT NULL DEFAULT '',
  experience_label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT about_singleton CHECK (singleton_id)
);

CREATE TABLE IF NOT EXISTS services_content (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  section_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT services_singleton CHECK (singleton_id)
);

CREATE TABLE IF NOT EXISTS service_items (
  id BIGSERIAL PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'zap',
  bullet_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_items_sort_order
  ON service_items (sort_order, id);

CREATE TABLE IF NOT EXISTS gallery_content (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  section_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gallery_singleton CHECK (singleton_id)
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Lainnya',
  title TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_category
  ON gallery_items (category);

CREATE INDEX IF NOT EXISTS idx_gallery_items_sort_order
  ON gallery_items (sort_order, id);

CREATE TABLE IF NOT EXISTS contact_content (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  section_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  email_label TEXT NOT NULL DEFAULT '',
  email_primary TEXT NOT NULL DEFAULT '',
  email_secondary TEXT NOT NULL DEFAULT '',
  phone_label TEXT NOT NULL DEFAULT '',
  phone_primary TEXT NOT NULL DEFAULT '',
  phone_secondary TEXT NOT NULL DEFAULT '',
  address_label TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  website_label TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_singleton CHECK (singleton_id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_active
  ON admin_users (is_active);

COMMIT;
