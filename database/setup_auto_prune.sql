-- ==========================================
-- Automated Click Pruning (7 AM Refresh)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Enable the pg_cron extension (Required)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant usage to postgres user if needed
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Schedule the Refresh Job
-- Format: 'minute hour day month day_of_week'
-- '0 7 * * *' = Exactly 07:00 Every Day
SELECT cron.schedule(
  'daily-7am-refresh',
  '0 7 * * *',
  $$ 
    -- Menghapus data klik yang berumur lebih dari 24 jam
    -- Ini aman karena hanya 'LOG' kunjungan, bukan Link-nya sendiri.
    DELETE FROM public.clicks 
    WHERE created_at < now() - interval '24 hours';
  $$
);

-- 4. Verify scheduled jobs
-- SELECT * FROM cron.job;
