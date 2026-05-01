export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = { 'Content-Type': 'application/json' };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { click_id, ip_address } = await context.request.json();

        if (!click_id || !ip_address) {
            return new Response('Missing parameters', { status: 400 });
        }

        await db.prepare('UPDATE clicks SET ip_address = ? WHERE id = ?').bind(ip_address, click_id).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (err) {
        console.error('IP Update error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
}
