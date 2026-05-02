// Link a domain to a Cloudflare Pages project
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

        const projectName = context.env.PAGES_PROJECT_NAME || 'ngeteam-v2';

        const domainsToLink = [domain, `*.${domain}`];
        const results = [];
        let hasError = false;

        for (const domainName of domainsToLink) {
            // Call Cloudflare API to add domain to Pages project
            const cfResponse = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects/${projectName}/domains`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cfToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: domainName
                    })
                }
            );

            const cfData = await cfResponse.json();

            if (!cfData.success) {
                const errors = cfData.errors || [];
                // Be very lenient with "already exists" errors
                const alreadyExists = errors.some(e =>
                    e.code === 8000000 ||
                    e.message?.toLowerCase().includes('already added') ||
                    e.message?.toLowerCase().includes('already exists') ||
                    e.message?.toLowerCase().includes('duplicate')
                );

                if (alreadyExists) {
                    results.push({ domain: domainName, message: 'Already exists/added' });
                } else {
                    hasError = true;
                    results.push({ domain: domainName, error: errors[0]?.message || 'Failed' });
                }
            } else {
                results.push({ domain: domainName, message: 'Linked successfully' });
            }
        }

        const rootSuccess = results.find(r => r.domain === domain && (r.message || !r.error));

        return new Response(JSON.stringify({
            success: !!rootSuccess,
            results,
            error: !rootSuccess ? results.find(r => r.error)?.error : null,
            message: !rootSuccess ? 'Root domain failed to link' : (hasError ? 'Root linked, but Wildcard failed (Plan limitation?)' : 'Pages domain setup complete')
        }), { status: rootSuccess ? 200 : 400, headers });

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
