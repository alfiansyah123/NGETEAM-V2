import { createSupabaseClient } from './utils/supabase';


// Comprehensive Bot detection for CLICK TRACKING exclusion & Limit Saving
function isTrackingBot(userAgent) {
    if (!userAgent) return true;
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
        'shodan', 'python', 'java', 'libwww-perl', 'lwp-trivial'
    ];
    return bots.some(bot => ua.includes(bot));
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

async function recordClick(supabase, link, request, env) {
    // Safety Switch: Check if tracking is disabled via Environment Variable
    // Values: 'OFF', 'LITE', 'FULL' (default)
    const trackingMode = (env.TRACKING_MODE || 'FULL').toUpperCase();
    if (trackingMode === 'OFF') return;

    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    if (isTrackingBot(userAgent)) return;

    const requestUrl = new URL(request.url);
    let clickId = requestUrl.searchParams.get('click_id') ||
        requestUrl.searchParams.get('clickid') ||
        requestUrl.searchParams.get('subid');

    if (!clickId && link.original_url) {
        try {
            const targetUrl = new URL(link.original_url);
            clickId = targetUrl.searchParams.get('click_id') ||
                targetUrl.searchParams.get('clickid') ||
                targetUrl.searchParams.get('subid');
        } catch (e) { /* ignore */ }
    }

    const country = request.cf?.country || 'XX';
    const getBestIP = () => {
        const h = request.headers;
        return h.get('cf-connecting-ip') || h.get('x-real-ip') || '0.0.0.0';
    };

    const ip = getBestIP();
    const os = detectOS(userAgent);
    const browser = detectBrowser(userAgent);

    try {
        const insertData = {
            link_id: link.id,
            slug: link.slug,
            country: country,
            ip_address: ip,
            click_id: clickId,
            os: os,
            browser: browser
        };

        // In LITE mode, we don't save heavy strings (UA and Referer)
        if (trackingMode === 'FULL') {
            insertData.user_agent = userAgent.substring(0, 500);
            insertData.referer = referer;
        }

        await supabase.from('clicks').insert(insertData);
    } catch (err) {
        console.error('Click tracking error:', err);
    }
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    const userAgent = context.request.headers.get('user-agent') || '';

    // 0. Aggressive Bot Blocking (Save CPU & Resource)
    // If it's a known bot/crawler, we immediately skip any heavy logic.
    const isBot = isTrackingBot(userAgent);

    if (path.startsWith('api/') || path.startsWith('assets/') || path === '' || path.includes('.')) {
        return context.next();
    }

    // 1. Edge Caching Check (Save Worker Quota)
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), context.request);
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;

    const supabase = createSupabaseClient(context.env);

    // 1. Slug Meta Cache (Save Supabase API & Egress)
    // We cache the link data for 10 minutes based ONLY on the slug.
    const metaCacheKey = new Request(`http://meta.internal/${path}`, context.request);
    let link;
    const cachedMeta = await cache.match(metaCacheKey);

    if (cachedMeta) {
        link = await cachedMeta.json();
    } else {
        const { data, error } = await supabase
            .from('links')
            .select(`
                *,
                domains ( url )
            `)
            .eq('slug', path)
            .single();

        if (error || !data) {
            return context.next();
        }
        link = data;

        // Cache the metadata for 10 minutes
        const metaResponse = new Response(JSON.stringify(link), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600, s-maxage=600'
            }
        });
        context.waitUntil(cache.put(metaCacheKey, metaResponse));
    }

    const userAgent = context.request.headers.get('user-agent') || '';
    context.waitUntil(recordClick(supabase, link, context.request, context.env));

    const country = context.request.cf?.country || 'XX';
    if (link.block_indonesia && country === 'ID') {
        const domainUrl = link.domains?.url || 'https://google.com';
        const redirectUrl = domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`;
        return Response.redirect(redirectUrl, 302);
    }

    // 2. Bot Preview Serving (Dangerous Site Prevention & Irit Limit)
    // We serve a "safe" HTML page to known social crawlers to prevent target URL flagging.
    const hasCustomMeta = link.title || link.description || link.image_url;
    if (isBot && hasCustomMeta) {
        const title = (link.title || 'Link Preview').replace(/"/g, '&quot;');
        const description = (link.description || 'Click to view').replace(/"/g, '&quot;');
        const image = link.image_url || '';

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${description}">${image ? `<meta property="og:image" content="${image}">` : ''}<meta name="twitter:card" content="summary_large_image"></head><body></body></html>`;

        const response = new Response(html, {
            headers: {
                ...getSecurityHeaders(true),
                'Content-Type': 'text/html; charset=utf-8'
            }
        });
        context.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
    }

    let target = link.original_url;
    if (url.search) {
        try {
            const targetUrl = new URL(target);
            const requestParams = new URL(context.request.url).searchParams;
            requestParams.forEach((value, key) => {
                targetUrl.searchParams.append(key, value);
            });
            target = targetUrl.toString();
        } catch (e) { /* ignore */ }
    }

    // 3. Fast 302 Redirect for Real Users (Cached for Irit Limit)
    const redirectResponse = new Response(null, {
        status: 302,
        headers: {
            ...getSecurityHeaders(true),
            'Location': target
        }
    });
    context.waitUntil(cache.put(cacheKey, redirectResponse.clone()));
    return redirectResponse;
}
