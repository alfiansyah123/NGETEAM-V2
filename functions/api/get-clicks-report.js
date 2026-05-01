export async function onRequestGet(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { results: clicks } = await db.prepare(`
            SELECT id, slug, country, ip_address, created_at, click_id, os, browser
            FROM clicks
            ORDER BY created_at DESC
            LIMIT 500
        `).all();

        const mappedClicks = (clicks || []).map(row => ({
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
