import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost({ request, env }) {
    const supabase = createSupabaseClient(env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
            return new Response(JSON.stringify({ success: false, error: 'No image uploaded' }), { status: 400, headers });
        }

        // Clean filename and make it unique
        const timestamp = Date.now();
        // Remove spaces and special characters for safe URL
        const safeOriginalName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'image.png';
        const fileName = `${timestamp}_${safeOriginalName}`;

        // Upload to Supabase Storage bucket named 'images'
        let { data, error } = await supabase
            .storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        // AUTO-CREATE BUCKET IF MISSING!
        if (error && error.message && error.message.toLowerCase().includes('bucket not found')) {
            console.log('Bucket "images" not found. Auto-creating public bucket...');
            await supabase.storage.createBucket('images', { public: true });
            
            // Retry upload
            const retry = await supabase
                .storage
                .from('images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            data = retry.data;
            error = retry.error;
        }

        if (error) throw error;

        // Construct the public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('images')
            .getPublicUrl(fileName);

        return new Response(JSON.stringify({ 
            success: true, 
            data: { url: publicUrlData.publicUrl } 
        }), { status: 200, headers });

    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Upload Failed: ' + error.message }), { status: 500, headers });
    }
}
