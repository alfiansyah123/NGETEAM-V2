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
        const url = new URL(context.request.url);
        const key = url.searchParams.get('key');

        let query = 'SELECT "key", "value" FROM settings';
        let params = [];
        if (key) {
            query += ' WHERE "key" = ?';
            params.push(key);
        }

        const { results } = await db.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({ settings: results }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
