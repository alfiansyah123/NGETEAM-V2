/**
 * cron-purge.js — Cloudflare Pages Function (HTTP endpoint)
 * Endpoint: GET /api/cron-purge?secret=RAHASIA_KAMU
 *
 * Karena Cloudflare Pages tidak support Cron Trigger,
 * panggil endpoint ini manual atau via cron-job.org (gratis) setiap hari.
 *
 * Setup cron-job.org:
 *   URL: https://yourdomain.com/api/cron-purge?secret=RAHASIA_KAMU
 *   Interval: Daily (jam 01:00 WIB)
 */
export async function onRequestGet(context) {
    const db = context.env.DB;
    const secret = context.env.CRON_SECRET;

    // Validasi secret key supaya tidak bisa dipanggil sembarang orang
    const reqSecret = new URL(context.request.url).searchParams.get('secret');
    if (secret && reqSecret !== secret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!db) {
        return new Response(JSON.stringify({ error: 'No DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const result = await db.prepare(
            "DELETE FROM clicks WHERE created_at < datetime('now', '-7 days')"
        ).run();

        return new Response(JSON.stringify({
            success: true,
            deleted: result.meta?.changes ?? 0
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
