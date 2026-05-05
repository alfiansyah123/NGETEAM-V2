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
        const body = await context.request.json();
        let { slug, original_url, domain_url, title, description, image_url, user_id, url_trafee, routing_mode } = body;

        domain_url = (domain_url || body.domain || '').trim();
        if (domain_url) {
            domain_url = domain_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }

        if (!slug || !original_url || !domain_url) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
        }

        // AUTO-FETCH: Kalau user gak isi title/image, ambil dari website tujuan SEKARANG
        // Ini cuma jalan 1x pas bikin link, BUKAN pas bot dateng = 0 KLIK GHOIB
        if (!title && !image_url) {
            try {
                const metaResp = await fetch(original_url, {
                    headers: { 'User-Agent': 'facebookexternalhit/1.1' },
                    redirect: 'follow'
                });
                const rawHtml = await metaResp.text();

                const getOg = (prop) => {
                    const m = rawHtml.match(new RegExp('<meta[^>]+property=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'))
                        || rawHtml.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + prop + '["\']', 'i'));
                    return m ? m[1] : '';
                };

                if (!title) {
                    title = getOg('og:title') || (rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
                }
                if (!description) {
                    description = getOg('og:description') || '';
                    if (!description) {
                        const descMatch = rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
                        if (descMatch) description = descMatch[1];
                    }
                }
                if (!image_url) {
                    image_url = getOg('og:image') || '';
                }
            } catch (e) {
                // Gagal fetch, lanjut tanpa preview
            }
        }

        // 1. Get Domain ID
        const domain = await db.prepare(`
            SELECT id FROM domains WHERE url LIKE ? AND active = 1 LIMIT 1
        `).bind(domain_url).first();

        if (!domain) {
            return new Response(JSON.stringify({ error: `Domain "${domain_url}" not found or inactive` }), { status: 400, headers });
        }

        const domainId = domain.id;

        // 2. Insert Link (sekarang title/description/image_url sudah terisi otomatis)
        try {
            await db.prepare(`
                INSERT INTO links (slug, original_url, domain_id, user_id, title, description, image_url, url_trafee, routing_mode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                slug,
                original_url,
                domainId,
                user_id || null,
                title || null,
                description || null,
                image_url || null,
                url_trafee || null,
                routing_mode || 'random'
            ).run();

            return new Response(JSON.stringify({ success: true, slug }), { status: 200, headers });
        } catch (insertError) {
            if (insertError.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({ error: 'Slug already exists' }), { status: 400, headers });
            }
            throw insertError;
        }

    } catch (err) {
        console.error('Save Link Error:', err);
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
