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
        let { slug, original_url, domain_url, title, description, image_url, user_id } = body;

        // Resilience: Handle 'domain' key and trim
        domain_url = (domain_url || body.domain || '').trim();
        if (domain_url) {
            domain_url = domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }

        if (!slug || !original_url || !domain_url) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
        }

        // 1. Get Domain ID (Resilient lookup)
        const { data: domainList, error: domainError } = await supabase
            .from('domains')
            .select('id')
            .ilike('url', domain_url)
            .eq('active', true);

        if (domainError || !domainList || domainList.length === 0) {
            return new Response(JSON.stringify({ error: `Domain "${domain_url}" not found or inactive` }), { status: 400, headers });
        }

        const domainId = domainList[0].id;

        // 2. Insert Link
        const { error: insertError } = await supabase
            .from('links')
            .insert({
                slug,
                original_url,
                domain_id: domainId,
                user_id: user_id || null,
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
