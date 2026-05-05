export async function onRequestPost({ request, env }) {
    const bucket = env.IMAGES; // Binding name di wrangler.toml
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!bucket) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'R2 Bucket "IMAGES" not bound. Silakan tambah binding R2 di Cloudflare Pages Dashboard.' 
        }), { status: 500, headers });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
            return new Response(JSON.stringify({ success: false, error: 'No image uploaded' }), { status: 400, headers });
        }

        const timestamp = Date.now();
        const safeOriginalName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'image.png';
        const fileName = `${timestamp}_${safeOriginalName}`;

        // Upload ke R2
        await bucket.put(fileName, file.stream(), {
            httpMetadata: {
                contentType: file.type || 'image/png',
                cacheControl: 'public, max-age=604800',
            }
        });

        // Catatan: Untuk mendapatkan URL publik, antum harus menghubungkan Domain atau 
        // mengaktifkan Managed Subdomain di Dashboard R2 Cloudflare untuk bucket ini.
        // Kita asumsikan antum menggunakan path /images/filename atau subdomain r2.
        
        // Sebagai fallback sementara agar dashboard tidak error:
        const publicUrl = `/api/view-image?name=${fileName}`;

        return new Response(JSON.stringify({ 
            success: true, 
            data: { url: publicUrl, name: fileName } 
        }), { status: 200, headers });

    } catch (error) {
        console.error('R2 Upload error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Upload Failed: ' + error.message }), { status: 500, headers });
    }
}
