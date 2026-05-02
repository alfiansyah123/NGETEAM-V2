export async function onRequest(context) {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (!db) return new Response(JSON.stringify({ error: 'DB connection failed', data: [] }), { status: 500, headers });

    try {
        // 1. Fetch Click Stats from D1 'clicks' table JOINed with 'team' to get real member names
        const localClicksPromise = db.prepare(`
            SELECT 
                COALESCE(t.name, c.slug) as smartlink_name,
                COUNT(*) as total_clicks, 
                COUNT(DISTINCT c.ip_address) as unique_clicks
            FROM clicks c
            LEFT JOIN team t ON c.slug = t.username
            WHERE date(c.created_at) BETWEEN ? AND ?
            GROUP BY smartlink_name
        `).bind(startDate, endDate).all();

        // 2. Fetch Lead Stats from D1 'daily_reports' (Postbacks)
        const localLeadsPromise = db.prepare(`
            SELECT smartlink, network, SUM(leads) as leads, SUM(payout) as payouts
            FROM daily_reports
            WHERE date BETWEEN ? AND ?
            GROUP BY smartlink, network
        `).bind(startDate, endDate).all();

        const [localClicksResult, localLeadsResult] = await Promise.all([
            localClicksPromise, localLeadsPromise
        ]);

        const localClicks = localClicksResult.results || [];
        const localLeads = localLeadsResult.results || [];

        const finalMap = {};

        // Process Local Leads (Trafee, etc.)
        for (const row of localLeads) {
            const name = row.smartlink;
            const network = (row.network || 'TRAFEE').toUpperCase();
            
            const key = `${name}_${network}`;
            if (!finalMap[key]) {
                finalMap[key] = {
                    smartlink: name,
                    smartlink_id: null,
                    network: network,
                    visits: 0, unique: 0, clicks: 0, leads: 0, payouts: 0.0
                };
            }
            finalMap[key].leads += row.leads || 0;
            finalMap[key].payouts += row.payouts || 0.0;
        }

        // Process Local Clicks
        for (const row of localClicks) {
            const name = row.smartlink_name;
            let found = false;
            for (const key in finalMap) {
                if (finalMap[key].smartlink === name) {
                    finalMap[key].clicks = (finalMap[key].clicks || 0) + row.total_clicks;
                    finalMap[key].unique = (finalMap[key].unique || 0) + row.unique_clicks;
                    found = true;
                }
            }
            
            if (!found) {
                finalMap[name] = {
                    smartlink: name,
                    smartlink_id: null,
                    network: 'TRAFEE',
                    visits: row.total_clicks,
                    unique: row.unique_clicks,
                    clicks: row.total_clicks,
                    leads: 0,
                    payouts: 0.0
                };
            }
        }

        const finalData = Object.values(finalMap).sort((a, b) => b.payouts - a.payouts || b.clicks - a.clicks);

        return new Response(JSON.stringify({ data: finalData }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, data: [] }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
