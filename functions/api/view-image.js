export async function onRequestGet({ request, env }) {
    const bucket = env.IMAGES;
    const url = new URL(request.url);
    const fileName = url.searchParams.get('name');

    if (!bucket || !fileName) {
        return new Response('File not found', { status: 404 });
    }

    try {
        const object = await bucket.get(fileName);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 tahun biar kenceng

        return new Response(object.body, {
            headers
        });
    } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
    }
}
