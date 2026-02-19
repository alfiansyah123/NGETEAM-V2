// Setup DNS records for a zone (wildcard + root CNAME)
export async function onRequestPost(context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { zoneId, domain, cfToken } = await context.request.json();

        if (!zoneId || !domain || !cfToken) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: zoneId, domain, cfToken'
            }), { status: 400, headers });
        }

        // Get the pages.dev target from environment or use default
        const pagesTarget = context.env.PAGES_DOMAIN || 'gen-codot.pages.dev';

        // DNS records to create
        const records = [
            { type: 'CNAME', name: '@', content: pagesTarget, proxied: true },
            { type: 'CNAME', name: '*', content: pagesTarget, proxied: true }
        ];

        const results = [];

        for (const record of records) {
            // First, check if record already exists
            const checkResponse = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=${record.type}&name=${record.name === '@' ? domain : record.name + '.' + domain}`,
                {
                    headers: {
                        'Authorization': `Bearer ${cfToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const checkData = await checkResponse.json();

            if (checkData.success && checkData.result.length > 0) {
                // Record exists, update it
                const existingId = checkData.result[0].id;
                const updateResponse = await fetch(
                    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${cfToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: record.type,
                            name: record.name,
                            content: record.content,
                            proxied: record.proxied
                        })
                    }
                );

                const updateData = await updateResponse.json();
                results.push({
                    record: record.name,
                    action: 'updated',
                    success: updateData.success
                });
            } else {
                // Create new record
                const createResponse = await fetch(
                    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cfToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: record.type,
                            name: record.name,
                            content: record.content,
                            proxied: record.proxied
                        })
                    }
                );

                const createData = await createResponse.json();
                results.push({
                    record: record.name,
                    action: 'created',
                    success: createData.success,
                    error: createData.errors?.[0]?.message
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            records: results,
            message: 'DNS records configured'
        }), { status: 200, headers });

    } catch (err) {
        return new Response(JSON.stringify({
            error: err.message
        }), { status: 500, headers });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
