export async function onRequestGet(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { results: domainsData } = await db.prepare(`
            SELECT url FROM domains WHERE active = 1 ORDER BY url ASC
        `).all();

        const domains = (domainsData || []).map(d => d.url);

        return new Response(JSON.stringify({ domains }), { status: 200, headers });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch domains: ' + error.message }), { status: 500, headers });
    }
}
