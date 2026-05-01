function generateToken(username) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const str = `${username}:${timestamp}:${random}`;
    try {
        return btoa(str);
    } catch (e) {
        return btoa(unescape(encodeURIComponent(str)));
    }
}

export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ success: false, error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { username, password } = await context.request.json();

        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, error: 'Username and password required' }), { status: 400, headers });
        }

        // 1. Check Admin Credentials
        let adminUser = 'ngeteam';
        let adminPass = 'NGEteam25!';

        try {
            const { results: settings } = await db.prepare(`
                SELECT "key", "value" FROM settings WHERE "key" IN ('admin_username', 'admin_password')
            `).all();

            if (settings && settings.length > 0) {
                const u = settings.find(s => s.key === 'admin_username');
                const p = settings.find(s => s.key === 'admin_password');
                if (u?.value) adminUser = u.value;
                if (p?.value) adminPass = p.value;
            }
        } catch (e) {
            console.warn('Could not fetch admin settings', e);
        }

        if (username === adminUser && password === adminPass) {
            const token = generateToken(username);
            return new Response(JSON.stringify({
                success: true,
                role: 'admin',
                token,
                message: 'Admin login successful'
            }), { status: 200, headers });
        }

        // 2. Check Team Member Credentials
        const teamMember = await db.prepare(`
            SELECT * FROM team WHERE user_id = ? AND password = ?
        `).bind(username, password).first();

        if (teamMember) {
            const token = generateToken(username);
            return new Response(JSON.stringify({
                success: true,
                role: 'member',
                token,
                message: 'Team login successful'
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ success: false, error: 'Invalid username or password' }), { status: 401, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'Server error: ' + error.message }), { status: 500, headers });
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
