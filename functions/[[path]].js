import { createSupabaseClient } from './utils/supabase';

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

async function recordClick(supabase, link, request, env, clickId) {
    const trackingMode = (env.TRACKING_MODE || 'FULL').toUpperCase();
    if (trackingMode === 'OFF') return;

    const userAgent = request.headers.get('user-agent') || '';
    if (isTrackingBot(userAgent)) return;

    const country = request.cf?.country || 'XX';
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '0.0.0.0';
    const os = detectOS(userAgent);
    const browser = detectBrowser(userAgent);

    if (os === 'Other' && browser === 'Other') return;

    try {
        const insertData = {
            link_id: link.id,
            slug: link.slug,
            country: country,
            ip_address: ip,
            os: os,
            browser: browser,
            click_id: clickId
        };
        await supabase.from('clicks').insert(insertData);
    } catch (err) {}
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    const userAgent = context.request.headers.get('user-agent') || '';

    const isBot = isTrackingBot(userAgent);

    if (path.startsWith('api/') || path.startsWith('assets/') || path.startsWith('admin') || path.startsWith('login') || path.startsWith('t/') || path === '' || path.includes('.')) {
        return context.next();
    }

    // 1. Edge Caching Check (Simple logic)
    const cache = caches.default;
    const cacheKey = new Request(context.request.url + (isBot ? '?bot=1' : '?user=1'), context.request);
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;

    const supabase = createSupabaseClient(context.env);

    // 2. Fetch Link Meta
    const { data: link, error } = await supabase
        .from('links')
        .select('id, slug, original_url, title, description, image_url, block_indonesia, domains(url)')
        .eq('slug', path)
        .single();

    if (error || !link) return context.next();

    // 3. Bot Preview Serving
    const hasCustomMeta = link.title || link.description || link.image_url;
    if (isBot && hasCustomMeta) {
        const title = (link.title || 'Link Preview').replace(/"/g, '&quot;');
        const description = (link.description || 'Click to view').replace(/"/g, '&quot;');
        const image = link.image_url || '';
        const ogUrl = url.toString();

        const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:url" content="${ogUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
${image ? `<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
</head><body></body></html>`;

        const response = new Response(html, {
            headers: { ...getSecurityHeaders(true), 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' }
        });
        context.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
    }

    // 4. Geo-Blocking
    const country = context.request.cf?.country || 'XX';
    if (link.block_indonesia && country === 'ID') {
        const domainUrl = link.domains?.url || 'https://google.com';
        const redirectUrl = domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`;
        return Response.redirect(redirectUrl, 302);
    }

    // 5. Target URL Reconstruction
    let target = link.original_url;
    if (url.search) {
        try {
            const targetUrl = new URL(target);
            const requestParams = new URL(context.request.url).searchParams;
            requestParams.forEach((v, k) => targetUrl.searchParams.append(k, v));
            target = targetUrl.toString();
        } catch (e) {}
    }

    // 6. Extract Click ID (Robust Regex)
    let clickId = null;
    
    // First check request URL query
    const extractViaRegex = (urlStr) => {
        if (!urlStr) return null;
        const match = urlStr.match(/[?&](click_id|clickid|subid)=([^&\s]+)/i);
        return match ? match[2] : null;
    };

    clickId = extractViaRegex(url.search) || extractViaRegex(target);

    // 7. Record Click & Redirect (ONLY FOR REAL HUMANS)
    context.waitUntil(recordClick(supabase, link, context.request, context.env, clickId));

    const redirectResponse = new Response(null, {
        status: 302,
        headers: { ...getSecurityHeaders(true), 'Location': target }
    });
    context.waitUntil(cache.put(cacheKey, redirectResponse.clone()));
    return redirectResponse;
}
