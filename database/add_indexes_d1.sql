-- ============================================================
-- add_indexes_d1.sql
-- Jalankan SEKALI SAJA di Cloudflare D1 Dashboard / wrangler d1 execute
--
-- Perintah via wrangler:
--   npx wrangler d1 execute ngeteam-gen --remote --file=database/add_indexes_d1.sql
-- ============================================================

-- Index utama untuk lookup slug (dipakai setiap kali ada klik/redirect masuk)
-- Karena slug sekarang selalu disimpan lowercase, exact match = cepat
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);

-- Index untuk filter user_id di links (dipakai get-smartlink-by-user)
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

-- Index untuk purge cron & sorting dashboard
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);

-- Index untuk lookup clicks by link
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);

-- Index untuk filter user_id di clicks
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);

-- ============================================================
-- OPSIONAL: Normalise slug lama ke lowercase (JALANKAN HATI-HATI!)
-- Ini agar slug lama yang disimpan dengan huruf besar tetap bisa
-- ditemukan oleh query baru (WHERE slug = 'lowercase')
-- 
-- UPDATE links SET slug = LOWER(slug);
-- ============================================================
