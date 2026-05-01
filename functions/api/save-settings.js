export async function onRequestPost(context) {
    const db = context.env.DB;
    const { key, value } = await context.request.json();
    const headers = { 'Content-Type': 'application/json' };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    if (key === undefined || key === null || value === undefined || value === null) {
        return new Response(JSON.stringify({ error: 'Missing key or value' }), { status: 400, headers });
    }

    try {
        await db.prepare(`
            INSERT INTO settings ("key", "value", updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT("key") DO UPDATE SET "value" = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `).bind(key, value).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
