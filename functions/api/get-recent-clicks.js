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
            SELECT 
                c.id,
                c.slug,
                c.country,
                c.ip_address,
                c.created_at,
                c.click_id,
                c.os,
                c.browser,
                l.title as link_title,
                l.original_url
            FROM clicks c
            LEFT JOIN links l ON c.link_id = l.id
            ORDER BY c.created_at DESC
            LIMIT 20
        `).all();

        const mappedClicks = (clicks || []).map(row => ({
            id: row.id,
            slug: row.slug,
            country: row.country || 'XX',
            ip: row.ip_address || 'unknown',
            time: row.created_at,
            title: row.link_title || row.slug,
            url: row.original_url,
            clickId: row.click_id || null,
            os: row.os || 'Unknown',
            browser: row.browser || 'Other'
        }));

        return new Response(JSON.stringify({ clicks: mappedClicks }), { status: 200, headers });

    } catch (err) {
        console.error('Recent Clicks Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
}
