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
        const { name, user_id, password } = await context.request.json();

        if (!name || !user_id || !password) {
            return new Response(JSON.stringify({ error: 'Name, User ID, and Password are required' }), { status: 400, headers });
        }

        try {
            const { results } = await db.prepare(`
                INSERT INTO team (name, user_id, password)
                VALUES (?, ?, ?)
                RETURNING *
            `).bind(name, user_id, password).all();

            return new Response(JSON.stringify({ success: true, data: results[0] }), { status: 200, headers });
        } catch (insertError) {
            if (insertError.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({ error: 'User ID already exists' }), { status: 400, headers });
            }
            throw insertError;
        }

    } catch (error) {
        console.error('Error adding team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
