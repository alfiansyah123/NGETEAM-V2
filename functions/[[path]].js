// Main redirect handler for D1

// Comprehensive Bot detection for CLICK TRACKING exclusion & Limit Saving
function isTrackingBot(userAgent) {
    if (!userAgent || userAgent.length < 10) return true;
    const ua = userAgent.toLowerCase();
    const bots = [
        'facebookexternalhit', 'facebot', 'facebookbot', 'facebookcatalog',
        'twitterbot', 'linkedinbot', 'pinterest', 'slackbot', 'telegrambot',
        'discordbot', 'googlebot', 'bingbot', 'yandex', 'duckduckgo', 'baidu',
        'mj12bot', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot',
        'uptimerobot', 'statuscake', 'monitor', 'curl', 'wget', 'python-requests',
        'go-http-client', 'javascript-fetch', 'axios', 'node-fetch',
        'ia_archiver', 'bot', 'crawler', 'spider', 'slurp', 'archiver',
        'headless', 'phantomjs', 'puppeteer', 'selenium', 'zgrab', 'censys',
        'shodan', 'python', 'java', 'libwww-perl', 'lwp-trivial',
        'whatsapp', 'outbrain', 'pinterestsdk', 'vkshare', 'bingpreview',
        'slack-imgproxy', 'tumblr', 'google-structured-data-testing-tool',
        'redditbot', 'applebot', 'bitlybot', 'chrome-lighthouse', 'screaming frog',
        'skypeuripreview', 'qwantify', 'bitrix link preview', 'metainspector',
        'tiktokbot', 'google-link-preview', 'embedly'
    ];
    
    return bots.some(bot => ua.includes(bot)) || (ua.includes('bot') && !ua.includes('chrome') && !ua.includes('android'));
}

// OS Detection
function detectOS(userAgent) {
    if (!userAgent) return 'Other';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    return 'Other';
}

// Browser/App Detection
function detectBrowser(userAgent) {
    if (!userAgent) return 'Other';
    const ua = userAgent.toLowerCase();
    if (ua.includes('fbav') || ua.includes('fban') || ua.includes('fbiab')) return 'Facebook';
    if (ua.includes('instagram')) return 'Instagram';
    if (ua.includes('tiktok')) return 'TikTok';
    if (ua.includes('whatsapp')) return 'WhatsApp';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    return 'Other';
}

// Security Headers Helper
function getSecurityHeaders(allowCache = false) {
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Permissions-Policy': 'interest-cohort=()'
    };
    if (allowCache) {
        headers['Cache-Control'] = 'public, max-age=60, s-maxage=60';
    } else {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
    return headers;
}

// 70. Record Click Logic using D1
async function recordClick(db, link, visitorData, env, clickId, networkName) {
    const { userAgent, country, ip, referer } = visitorData;
    
    // Detect OS/Browser but don't block
    const os = detectOS(userAgent);
    const browser = detectBrowser(userAgent);

    try {
        await db.prepare(`
            INSERT INTO clicks (link_id, slug, country, ip_address, os, browser, click_id, user_agent, referer, s3)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            link.id,
            link.slug,
            country,
            ip,
            os,
            browser,
            clickId,
            userAgent,
            referer || null,
            (networkName || 'UNKNOWN').toUpperCase()
        ).run();
    } catch (err) {
        // We can't see this easily, but we'll know if it fails
    }
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    const userAgent = context.request.headers.get('user-agent') || '';

    const isBot = isTrackingBot(userAgent);

    if (path.startsWith('api/') || path.startsWith('assets/') || path.startsWith('admin') || path.startsWith('login') || path.startsWith('t/') || path === '' || path.includes('.')) {
        return context.next();
    }

    const db = context.env.DB;
    if (!db) {
        return new Response('Database connection error', { status: 500 });
    }

    // 2. Fetch Link Meta from D1 (Case-Insensitive)
    const link = await db.prepare(`
        SELECT l.*, d.url as domain_url 
        FROM links l 
        LEFT JOIN domains d ON l.domain_id = d.id 
        WHERE LOWER(l.slug) = LOWER(?)
    `).bind(path).first();

    if (!link) return context.next();

    // 3. Bot Preview Serving
    if (isBot) {
        const title = (link.title || 'Link Preview').replace(/"/g, '&quot;');
        const description = (link.description || 'Click to view').replace(/"/g, '&quot;');
        const image = link.image_url || '';

        const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
${image ? `<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
</head><body></body></html>`;

        const response = new Response(html, {
            headers: { ...getSecurityHeaders(false), 'Content-Type': 'text/html; charset=utf-8' }
        });
        return response;
    }

    // 4. Geo-Blocking
    const country = context.request.cf?.country || 'XX';
    if (link.block_indonesia && country === 'ID') {
        const domainUrl = link.domain_url || 'https://google.com';
        const redirectUrl = domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`;
        return Response.redirect(redirectUrl, 302);
    }

    // 5. Target URL Selection
    let target = link.original_url;
    let networkUsed = 'IMONETIZEIT';
    const mode = link.routing_mode || 'random';
    const trafeeUrl = link.url_trafee || link.trafee_url;

    if (mode === 'trafee' && trafeeUrl) {
        target = trafeeUrl;
        networkUsed = 'TRAFEE';
    } else if (mode === 'imonetizeit') {
        target = link.original_url;
        networkUsed = 'IMONETIZEIT';
    } else if (mode === 'random') {
        // SMART LOGIC: Tier 1 to iMonetizeit, others to Trafee
        const topTier = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'CH', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'BE'];
        if (!topTier.includes(country) && trafeeUrl) {
            target = trafeeUrl;
            networkUsed = 'TRAFEE';
        }
    }

    if (url.search) {
        try {
            const targetUrl = new URL(target);
            const requestParams = new URL(context.request.url).searchParams;
            requestParams.forEach((v, k) => targetUrl.searchParams.append(k, v));
            target = targetUrl.toString();
        } catch (e) {}
    }

    // 6. Extract Click ID
    let clickId = null;
    const extractViaRegex = (urlStr) => {
        if (!urlStr) return null;
        const match = urlStr.match(/[?&](click_id|clickid|subid|track)=([^&\s]+)/i);
        return match ? match[2] : null;
    };
    clickId = extractViaRegex(url.search) || extractViaRegex(target);

    // 7. Record Click & Redirect
    const visitorData = {
        userAgent,
        country,
        ip: context.request.headers.get('cf-connecting-ip') || context.request.headers.get('x-real-ip') || '0.0.0.0',
        referer: context.request.headers.get('referer')
    };
    context.waitUntil(recordClick(db, link, visitorData, context.env, clickId, networkUsed));

    const redirectResponse = new Response(null, {
        status: 302,
        headers: { ...getSecurityHeaders(false), 'Location': target }
    });
    return redirectResponse;
}
