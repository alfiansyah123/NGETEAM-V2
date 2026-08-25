/**
 * cron-purge.js
 * Cloudflare Pages Scheduled Handler — jalan via Cron Trigger
 * Didaftarkan di wrangler.toml: crons = ["0 18 * * *"]  (01:00 WIB)
 *
 * Tugasnya: hapus clicks > 7 hari, BUKAN dijalankan oleh pengunjung
 */
export async function onScheduled(event, env, ctx) {
    const db = env.DB;
    if (!db) return;

    try {
        const result = await db.prepare(
            "DELETE FROM clicks WHERE created_at < datetime('now', '-7 days')"
        ).run();

        console.log(`[cron-purge] Deleted ${result.meta?.changes ?? 0} old click(s).`);
    } catch (err) {
        console.error('[cron-purge] Error:', err.message);
    }
}
