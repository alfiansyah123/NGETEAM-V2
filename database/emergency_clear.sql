-- ==========================================
-- EMERGENCY NUKE SCRIPT
-- Only use this if Supabase is 100% full!
-- ==========================================

-- This will INSTANTLY delete MILLIONS of clicks logs.
-- Your links will survive, but your history will be empty.
TRUNCATE TABLE public.clicks;

-- If you have a massive ID sequence, reset it too
ALTER SEQUENCE clicks_id_seq RESTART WITH 1;
