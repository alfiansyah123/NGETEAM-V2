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
        const { links } = await context.request.json();

        if (!links || !Array.isArray(links) || links.length === 0) {
            return new Response(JSON.stringify({ error: 'Valid links array required' }), { status: 400, headers });
        }

        // 1. Get Domain IDs
        const domainUrls = [...new Set(links.map(l => l.domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()))];
        
        // SQLite doesn't support complex IN with multiple values as easily in a single prepare,
        // so we'll fetch all active domains and filter in memory since the list is usually small
        const { results: domainList } = await db.prepare(`SELECT id, url FROM domains WHERE active = 1`).all();
        
        const domainMap = {};
        (domainList || []).forEach(d => {
            domainMap[d.url.toLowerCase()] = d.id;
        });

        // 2. Prepare Batch Statements
        const statements = [];
        const validLinks = [];

        for (const link of links) {
            const cleanDomain = link.domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
            const domainId = domainMap[cleanDomain];

            if (domainId) {
                statements.push(db.prepare(`
                    INSERT INTO links (slug, original_url, domain_id, user_id, title, description, image_url, url_trafee, routing_mode)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    link.slug,
                    link.original_url,
                    domainId,
                    link.user_id || null,
                    link.title || null,
                    link.description || null,
                    link.image_url || null,
                    link.url_trafee || null,
                    link.routing_mode || 'random'
                ));
                validLinks.push(link);
            }
        }

        if (statements.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid domains found for the provided links' }), { status: 400, headers });
        }

        // 3. Execute Batch
        try {
            await db.batch(statements);
            return new Response(JSON.stringify({ success: true, count: statements.length }), { status: 200, headers });
        } catch (batchError) {
            if (batchError.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({ error: 'One or more slugs already exist' }), { status: 400, headers });
            }
            throw batchError;
        }

    } catch (err) {
        console.error('Batch Save Link Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
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
