// Deploy a proxy Worker to handle wildcard subdomains for Pages Free plan
export async function onRequestPost(context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { domain, cfToken, cfAccountId } = await context.request.json();

        if (!domain || !cfToken || !cfAccountId) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: domain, cfToken, cfAccountId'
            }), { status: 400, headers });
        }

        const pagesTarget = context.env.PAGES_DOMAIN || 'ngeteam-gen.pages.dev';
        const workerName = `proxy-${domain.replace(/\./g, '-')}`;

        // 1. Worker Script Content (Service Worker format for easier single-file upload)
        const scriptContent = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  url.hostname = '${pagesTarget}';
  url.protocol = 'https:';
  
  // Create new request
  const newRequest = new Request(url, request);
  
  // Ensure host header matches the Pages target
  newRequest.headers.set('Host', '${pagesTarget}');
  
  try {
    return await fetch(newRequest);
  } catch (e) {
    return new Response('Worker Proxy Error: ' + e.message, { status: 502 });
  }
}
        `;

        // 2. Upload Worker Script
        const uploadRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/javascript'
                },
                body: scriptContent
            }
        );

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
            return new Response(JSON.stringify({
                error: `Worker Upload Failed: ${uploadData.errors?.[0]?.message || 'Unknown error'}`,
                details: uploadData.errors
            }), { status: 400, headers });
        }

        // 3. Setup Worker Routes
        // We need to add routes for both root and wildcard
        const routes = [`${domain}/*`, `*.${domain}/*`];
        const routeResults = [];

        // Get Zone ID first
        const zoneRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
            {
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const zoneData = await zoneRes.json();
        if (!zoneData.success || zoneData.result.length === 0) {
            throw new Error('Could not find Zone ID for domain: ' + domain);
        }
        const zoneId = zoneData.result[0].id;

        for (const pattern of routes) {
            const routeRes = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cfToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pattern: pattern,
                        script: workerName
                    })
                }
            );
            const routeData = await routeRes.json();
            routeResults.push({ pattern, success: routeData.success, error: routeData.errors?.[0]?.message });
        }

        return new Response(JSON.stringify({
            success: true,
            workerName,
            routeResults,
            message: 'Worker Sakti deployed and routes configured!'
        }), { status: 200, headers });

    } catch (err) {
        return new Response(JSON.stringify({
            error: err.message
        }), { status: 500, headers });
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
