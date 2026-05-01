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
        const data = await context.request.json();
        let url = data.url || data.domain || data.dns_target;

        if (!url) {
            return new Response(JSON.stringify({ error: 'Domain URL is required' }), { status: 400, headers });
        }

        url = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Check if exists
        const existing = await db.prepare(`
            SELECT id, active FROM domains WHERE url = ?
        `).bind(url).first();

        if (existing) {
            if (!existing.active) {
                await db.prepare(`UPDATE domains SET active = 1 WHERE id = ?`).bind(existing.id).run();
                return new Response(JSON.stringify({ success: true, message: 'Domain reactivated', domain: url }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ success: true, message: 'Domain already exists', domain: url }), { status: 200, headers });
        }

        // Insert new
        await db.prepare(`INSERT INTO domains (url, active) VALUES (?, 1)`).bind(url).run();

        return new Response(JSON.stringify({ success: true, domain: url }), { status: 200, headers });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
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
