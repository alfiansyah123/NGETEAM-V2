export async function onRequest(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error', data: [] }), { status: 500, headers });
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
                c.network,
                c.s3,
                l.title as link_title,
                l.original_url
            FROM clicks c
            LEFT JOIN links l ON c.link_id = l.id
            WHERE (c.user_id IS NULL OR c.user_id != 'gencrot')
            ORDER BY c.created_at DESC
            LIMIT 50
        `).all();

        // Map data to match what the Dashboard expects (Realtime Dashboard)
        const mappedData = (clicks || []).map(row => ({
            id: row.id,
            slug: row.slug,
            country: row.country || 'XX',
            ip_address: row.ip_address || 'unknown',
            created_at: row.created_at,
            click_id: row.click_id || null,
            os: row.os || 'Unknown',
            browser: row.browser || 'Other',
            network: row.network || null,
            s3: row.s3 || null,
            link_title: row.link_title || row.slug,
            original_url: row.original_url || ''
        }));

        return new Response(JSON.stringify({ 
            success: true, 
            data: mappedData 
        }), { status: 200, headers });

    } catch (err) {
        console.error('Recent Clicks Error:', err);
        return new Response(JSON.stringify({ success: false, error: err.message, data: [] }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
