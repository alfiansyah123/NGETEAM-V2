export async function onRequest(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'DATABASE BINDING MISSING! Check your Cloudflare Dashboard Settings -> Functions -> D1 Bindings' }), { status: 500, headers });
    }

    try {
        // Try a test write
        const testId = `debug-${Date.now()}`;
        await db.prepare(`
            INSERT INTO clicks (link_id, slug, country, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `).bind(0, 'DEBUG-SYSTEM', 'XX', '0.0.0.0', 'Debug Tool').run();

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'DATABASE IS WORKING! Write successful.',
            note: 'If this works but clicks still dont show up, the issue is in your bot filter or slug matching.'
        }), { status: 200, headers });

    } catch (err) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: err.message,
            stack: err.stack
        }), { status: 500, headers });
    }
}
