// Soft Delete domain (Hide from UI, keep in DB)
export async function onRequest(context) {
    if (context.request.method !== 'DELETE' && context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

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
        const reqData = await context.request.json().catch(() => ({}));
        const domain = reqData.domain || reqData.url;

        if (!domain) {
            return new Response(JSON.stringify({ error: 'Domain is required' }), { status: 400, headers });
        }

        const cleanDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

        if (!cleanDomain) {
            return new Response(JSON.stringify({ error: 'Valid domain is required' }), { status: 400, headers });
        }

        const { success, meta } = await db.prepare(`
            UPDATE domains SET active = 0 WHERE url = ?
        `).bind(cleanDomain).run();

        const numUpdated = meta.changes;

        if (numUpdated === 0) {
            return new Response(JSON.stringify({
                success: true,
                message: `Domain not found (already deleted?)`,
                deleted: 0
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Domain deactivated (Soft Delete)`,
            deleted: numUpdated
        }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
