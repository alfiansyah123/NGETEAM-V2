import { createClient } from '@supabase/supabase-js';

export async function onRequestPost({ request, env }) {
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_KEY || env.VITE_SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!supabaseUrl || !supabaseKey) {
        return new Response(JSON.stringify({ success: false, error: 'Supabase credentials missing' }), { status: 500, headers });
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

        let { data, error } = await supabase
            .storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error && error.message && error.message.toLowerCase().includes('bucket not found')) {
            await supabase.storage.createBucket('images', { public: true });
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
