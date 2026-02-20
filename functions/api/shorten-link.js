export async function onRequestPost(context) {
    try {
        const { url, service } = await context.request.json();

        if (!url || !service) {
            return new Response(JSON.stringify({ error: 'Missing URL or Service' }), { status: 400 });
        }

        let shortenedUrl = url;

        switch (service.toUpperCase()) {
            case 'IX.SK':
                try {
                    // Try the common ix.sk API pattern
                    const res = await fetch(`https://ix.sk/api/?v=1.1&short=${encodeURIComponent(url)}`);
                    if (res.ok) {
                        const text = await res.text();
                        if (text && text.startsWith('http')) {
                            shortenedUrl = text.trim();
                        }
                    }
                } catch (e) {
                    console.error('ix.sk error:', e);
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
