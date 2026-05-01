export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { id, name, user_id, password, target_url, url_trafee, old_user_id } = await context.request.json();

        if (!id || !name || !user_id || !password) {
            return new Response(JSON.stringify({ error: 'ID, Name, User ID, and Password are required' }), { status: 400, headers });
        }

        // Step 1: Update Team Table
        await db.prepare(`
            UPDATE team SET name = ?, user_id = ?, password = ? WHERE id = ?
        `).bind(name, user_id, password, id).run();

        // Step 2: Update Links Table
        if (old_user_id) {
            // 2a. Update primary link
            await db.prepare(`
                UPDATE links SET slug = ?, user_id = ?, original_url = ?, url_trafee = ?, routing_mode = 'random'
                WHERE slug = ?
            `).bind(user_id, user_id, target_url, url_trafee || null, old_user_id).run();

            // 2b. Update all other links
            await db.prepare(`
                UPDATE links SET original_url = ?, url_trafee = ?, user_id = ?
                WHERE user_id = ?
            `).bind(target_url, url_trafee || null, user_id, old_user_id).run();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
