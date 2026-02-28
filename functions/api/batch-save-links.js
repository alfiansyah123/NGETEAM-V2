import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = await context.request.json();
        const { links } = body;

        if (!links || !Array.isArray(links) || links.length === 0) {
            return new Response(JSON.stringify({ error: 'Valid links array required' }), { status: 400, headers });
        }

        // 1. Process Domain URLs to get IDs
        // We'll group links by domain to avoid redundant lookups
        const domainUrls = [...new Set(links.map(l => l.domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '')))];

        const { data: domainList, error: domainError } = await supabase
            .from('domains')
            .select('id, url')
            .in('url', domainUrls)
            .eq('active', true);

        if (domainError || !domainList) throw domainError;

        const domainMap = {};
        domainList.forEach(d => {
            domainMap[d.url.toLowerCase()] = d.id;
        });

        // 2. Prepare bulk insert data
        const insertData = links.map(link => {
            const cleanDomain = link.domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
            const domainId = domainMap[cleanDomain];

            if (!domainId) return null;

            return {
                slug: link.slug,
                original_url: link.original_url,
                domain_id: domainId,
                user_id: link.user_id || null,
                title: link.title || null,
                description: link.description || null,
                image_url: link.image_url || null
            };
        }).filter(Boolean);

        if (insertData.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid domains found' }), { status: 400, headers });
        }

        // 3. Perform bulk insert
        const { error: insertError } = await supabase
            .from('links')
            .insert(insertData);

        if (insertError) {
            if (insertError.code === '23505') {
                return new Response(JSON.stringify({ error: 'One or more slugs already exist' }), { status: 400, headers });
            }
            throw insertError;
        }

        return new Response(JSON.stringify({ success: true, count: insertData.length }), { status: 200, headers });

    } catch (err) {
        console.error('Batch Save Link Error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error: ' + err.message }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
