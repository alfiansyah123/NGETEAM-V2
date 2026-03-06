import { createSupabaseClient } from '../utils/supabase';

export async function onRequestGet(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    const url = new URL(context.request.url);
    const period = url.searchParams.get('period') || 'today';

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
            .limit(500);

        if (error) throw error;

        // Map response to match expected frontend format
        const mappedClicks = clicks.map(row => ({
            id: row.id,
            slug: row.slug,
            country: row.country || 'XX',
            ip: row.ip_address || 'unknown',
            time: row.created_at,
            clickId: row.click_id,
            os: row.os || 'Unknown',
            browser: row.browser || 'Other'
        }));

        return new Response(JSON.stringify({ clicks: mappedClicks }), { status: 200, headers });

    } catch (err) {
        console.error('Reports Error:', err);
        return new Response(JSON.stringify({ error: 'Failed to fetch reports: ' + err.message }), { status: 500, headers });
    }
}
