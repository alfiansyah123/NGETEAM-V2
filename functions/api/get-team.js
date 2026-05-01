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
        // Step 1: Fetch all team members
        const { results: team } = await db.prepare(`
            SELECT id, name, user_id, password, trafee_url FROM team ORDER BY name ASC
        `).all();

        if (!team || team.length === 0) {
            return new Response(JSON.stringify({ success: true, team: [] }), { status: 200, headers });
        }

        // Step 2: Fetch primary links (where slug = user_id)
        const { results: links } = await db.prepare(`
            SELECT slug, original_url, user_id FROM links WHERE slug IN (SELECT user_id FROM team)
        `).all();

        // Merge data
        const mergedTeam = team.map(member => {
            const linkData = (links || []).find(l => l.user_id === member.user_id && l.slug === member.user_id);
            return {
                ...member,
                links: linkData ? { original_url: linkData.original_url } : null
            };
        });

        return new Response(JSON.stringify({ success: true, team: mergedTeam }), { status: 200, headers });

    } catch (error) {
        console.error('Database error in get-team:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch team: ' + error.message
        }), { status: 500, headers });
    }
}
