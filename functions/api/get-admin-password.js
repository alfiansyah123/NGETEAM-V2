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
        let password = 'NGEteam25!';

        try {
            const result = await db.prepare('SELECT value FROM settings WHERE "key" = ?').bind('admin_password').first();
            if (result?.value) {
                password = result.value;
            }
        } catch (dbError) {
            console.warn('Could not fetch admin password from DB, using default.', dbError);
        }

        return new Response(JSON.stringify({ success: true, password }), { status: 200, headers });

    } catch (error) {
        console.error('Error fetching password:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch password' }), { status: 500, headers });
    }
}
