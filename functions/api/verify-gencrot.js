export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { password } = await context.request.json();
        if (!password) {
            return new Response(JSON.stringify({ error: 'Password required' }), { status: 400, headers });
        }

        // Get gencrot_password from settings
        const row = await db.prepare(`SELECT value FROM settings WHERE key = 'gencrot_password'`).first();
        const storedPassword = row?.value || 'gencrot123'; // default fallback

        if (password === storedPassword) {
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        } else {
            return new Response(JSON.stringify({ error: 'Password salah' }), { status: 401, headers });
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
