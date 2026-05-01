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
        const { password } = await context.request.json();

        if (!password || password.length < 6) {
            return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers });
        }

        await db.prepare(`
            INSERT INTO settings ("key", "value", updated_at) 
            VALUES ('admin_password', ?, CURRENT_TIMESTAMP)
            ON CONFLICT("key") DO UPDATE SET "value" = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `).bind(password).run();

        return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating password:', error);
        return new Response(JSON.stringify({ error: 'Failed to update password: ' + error.message }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
