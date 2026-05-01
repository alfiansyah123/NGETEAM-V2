// Pre-warm social media caches so thumbnails appear INSTANTLY when shared
export async function onRequestPost({ request, env }) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const { urls } = await request.json();
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'No URLs provided' }), { status: 400, headers });
        }

        // Limit to 10 URLs max per request to prevent abuse
        const toWarm = urls.slice(0, 10);

        const results = await Promise.allSettled(
            toWarm.map(async (url) => {
                // 1. Facebook: Force scrape via Graph API (no token needed for basic scrape)
                try {
                    await fetch(`https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true`, {
                        method: 'POST'
                    });
                } catch (e) {
                    console.warn('FB warm failed:', e);
                }

                // 2. Self-warm: Hit our own worker to trigger edge caching
                try {
                    await fetch(url, {
                        headers: { 'User-Agent': 'facebookexternalhit/1.1' },
                        redirect: 'manual'
                    });
                } catch (e) {
                    console.warn('Self-warm failed:', e);
                }

                return { url, warmed: true };
            })
        );

        return new Response(JSON.stringify({ 
            success: true, 
            warmed: results.filter(r => r.status === 'fulfilled').length 
        }), { status: 200, headers });

    } catch (error) {
        console.error('Warm error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}
