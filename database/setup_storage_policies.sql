-- 1. Buat bucket 'images' jika belum ada sisa dari percobaan sebelumnya
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Hapus policy lama (jika ada) biar tidak bentrok
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable public upload" ON storage.objects;

-- 3. Buka akses SELECT (Read/Lihat Gambar) ke seluruh dunia (Public)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- 4. Buka akses INSERT (Upload/Tulis Gambar) tanpa auth (jika dari frontend public)
-- (Catatan: Karena upload NGETEAM-GEN lewat Cloudflare Backend menggunakan Service Key, 
--  sebenarnya insert policy tidak wajib karena Service Key mem-bypass RLS, 
--  tapi ini berjaga-jaga jika sewaktu-waktu upload dipindah ke frontend langsung)
CREATE POLICY "Enable public upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images');
