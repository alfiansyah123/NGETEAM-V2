export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { admin_password, new_password } = await context.request.json();
        if (!admin_password || !new_password) {
            return new Response(JSON.stringify({ error: 'admin_password dan new_password wajib diisi' }), { status: 400, headers });
        }

        // Verify admin password first
        const adminRow = await db.prepare(`SELECT value FROM settings WHERE key = 'admin_password'`).first();
        const adminPass = adminRow?.value || 'admin123';

        if (admin_password !== adminPass) {
            return new Response(JSON.stringify({ error: 'Admin password salah' }), { status: 401, headers });
        }

        // Upsert gencrot_password
        await db.prepare(`
            INSERT INTO settings (key, value) VALUES ('gencrot_password', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).bind(new_password).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
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
