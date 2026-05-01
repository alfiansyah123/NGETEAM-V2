export async function onRequestGet(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers });
    }

    try {
        // Step 1: Fetch team member
        const team = await db.prepare(`
            SELECT * FROM team WHERE user_id LIKE ? LIMIT 1
        `).bind(userId).first();

        if (!team) {
            return new Response(JSON.stringify({ error: 'Team member not found' }), { status: 404, headers });
        }

        // Step 2: Fetch associated link - Robust & Case-insensitive
        const link = await db.prepare(`
            SELECT * FROM links WHERE LOWER(slug) = LOWER(?) LIMIT 1
        `).bind(team.user_id).first();

        return new Response(JSON.stringify({
            success: true,
            data: {
                name: team.name,
                user_id: team.user_id,
                target_url: link?.original_url || null,
                url_trafee: link?.url_trafee || link?.trafee_url || null
            },
            debug: link // Kita intip semua isinya di sini!
        }), { status: 200, headers });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch smartlink: ' + error.message }), { status: 500, headers });
    }
}
