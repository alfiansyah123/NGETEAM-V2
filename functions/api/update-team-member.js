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
        const { id, name, user_id, password, target_url, old_user_id } = await context.request.json();

        if (!id || !name || !user_id || !password) {
            return new Response(JSON.stringify({ error: 'ID, Name, User ID, and Password are required' }), { status: 400, headers });
        }

        const effectiveOldUserId = old_user_id || user_id;

        // Step 1: Update Team Table
        await db.prepare(`
            UPDATE team SET name = ?, user_id = ?, password = ? WHERE id = ?
        `).bind(name, user_id, password, id).run();

        // Step 2: Update Primary Link in Links Table (match by primary link's slug = effectiveOldUserId)
        let primaryResult = await db.prepare(`
            UPDATE links SET slug = ?, user_id = ?, original_url = ?
            WHERE slug = ?
        `).bind(user_id, user_id, target_url, effectiveOldUserId).run();

        // If no link had slug = effectiveOldUserId, fallback to updating where user_id = effectiveOldUserId AND slug = user_id
        if ((!primaryResult.meta || primaryResult.meta.changes === 0) && target_url) {
            primaryResult = await db.prepare(`
                UPDATE links SET slug = ?, user_id = ?, original_url = ?
                WHERE user_id = ? AND slug = ?
            `).bind(user_id, user_id, target_url, effectiveOldUserId, user_id).run();
        }

        // Step 3: If user_id changed, update user_id for any generated sub-links owned by effectiveOldUserId
        if (effectiveOldUserId !== user_id) {
            await db.prepare(`
                UPDATE links SET user_id = ? WHERE user_id = ?
            `).bind(user_id, effectiveOldUserId).run();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
