import { createSupabaseClient } from '../utils/supabase';

// Soft Delete domain (Hide from UI, keep in DB)
export async function onRequest(context) {
    // Handle DELETE method (or POST with action)
    if (context.request.method !== 'DELETE' && context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const supabase = createSupabaseClient(context.env);
        const reqData = await context.request.json().catch(() => ({}));
        const domain = reqData.domain || reqData.url;

        if (!domain) {
            return new Response(JSON.stringify({ error: 'Domain is required' }), { status: 400, headers });
        }

        // Clean URL
        const cleanDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

        if (!cleanDomain) {
            return new Response(JSON.stringify({ error: 'Valid domain is required' }), { status: 400, headers });
        }

        // Perform Soft Delete (Set active = false)
        const { data, error } = await supabase
            .from('domains')
            .update({ active: false })
            .eq('url', cleanDomain)
            .select();

        if (error) throw error;

        // Check if anything was updated
        const numUpdated = data ? data.length : 0;

        if (numUpdated === 0) {
            return new Response(JSON.stringify({
                success: true,
                message: `Domain not found (already deleted?)`,
                deleted: 0
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Domain deactivated (Soft Delete)`,
            deleted: numUpdated
        }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
