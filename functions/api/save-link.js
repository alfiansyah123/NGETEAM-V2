import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);

    // CORS headers helper (could be middleware, but inline for now)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = await context.request.json();
        const { slug, original_url, domain_url, title, description, image_url } = body;

        if (!slug || !original_url || !domain_url) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
        }

        // 1. Get Domain ID
        const { data: domain, error: domainError } = await supabase
            .from('domains')
            .select('id')
            .eq('url', domain_url)
            .single();

        if (domainError || !domain) {
            return new Response(JSON.stringify({ error: 'Domain not found' }), { status: 400, headers });
        }

        // 2. Insert Link
        const { error: insertError } = await supabase
            .from('links')
            .insert({
                slug,
                original_url,
                domain_id: domain.id,
                title: title || null,
                description: description || null,
                image_url: image_url || null
            });

        if (insertError) {
            // Check for uniqueness violation
            if (insertError.code === '23505') { // Postgres unique_violation
                return new Response(JSON.stringify({ error: 'Slug already exists' }), { status: 400, headers });
            }
            throw insertError;
        }

        return new Response(JSON.stringify({ success: true, slug }), { status: 200, headers });

    } catch (err) {
        console.error('Save Link Error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
