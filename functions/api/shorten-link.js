export async function onRequestPost(context) {
    try {
        const { url, service, apiKey } = await context.request.json();

        if (!url || !service) {
            return new Response(JSON.stringify({ error: 'Missing URL or Service' }), { status: 400 });
        }

        let shortenedUrl = url;

        switch (service.toUpperCase()) {
            case 'IX.SK':
                try {
                    // Try the IX.SK / Link.sk API pattern
                    // If no key, it might still work for some time, but key is better
                    const apiParam = apiKey ? `&api=${encodeURIComponent(apiKey)}` : '';
                    const apiUrl = `https://ix.sk/api/?v=1.1${apiParam}&short=${encodeURIComponent(url)}`;

                    const res = await fetch(apiUrl);
                    if (res.ok) {
                        const text = await res.text();
                        if (text && text.startsWith('http')) {
                            shortenedUrl = text.trim();
                        } else {
                            // If text is not a URL, maybe it's an error message or needs POST
                            console.warn('IX.SK API returned non-URL:', text);

                            // Try POST fallback if key exists
                            if (apiKey) {
                                const postRes = await fetch('https://ix.sk/api/url/add', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`
                                    },
                                    body: JSON.stringify({ url })
                                });
                                if (postRes.ok) {
                                    const data = await postRes.json();
                                    if (data.short) shortenedUrl = data.short;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('ix.sk error:', e);
                }
                break;

            case 'TINYURL':
                try {
                    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                    if (res.ok) shortenedUrl = await res.text();
                } catch (e) {
                    console.error('TinyURL error:', e);
                }
                break;

            default:
                shortenedUrl = url;
        }

        return new Response(JSON.stringify({ success: true, shortenedUrl }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
