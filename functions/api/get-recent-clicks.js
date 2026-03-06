import { createSupabaseClient } from '../utils/supabase';

export async function onRequestGet(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const { data: clicks, error } = await supabase
            .from('clicks')
            .select(`
                id,
                slug,
                country,
                ip_address,
                created_at,
                click_id,
                os,
                browser
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Map to frontend expectation matching original PHP/Node logic
        const mappedClicks = clicks.map(row => ({
            id: row.id,
            slug: row.slug,
            country: row.country || 'XX',
            ip: row.ip_address || 'unknown',
            time: row.created_at,
            title: row.links?.title || row.slug,
            url: row.links?.original_url,
            clickId: row.click_id || null,
            os: row.os || 'Unknown',
            browser: row.browser || 'Other',
            referer: row.referer || null
        }));

        return new Response(JSON.stringify({ clicks: mappedClicks }), { status: 200, headers });

    } catch (err) {
        console.error('Recent Clicks Error:', err);
        return new Response(JSON.stringify({ error: err.message, details: err }), { status: 500, headers });
    }
}
