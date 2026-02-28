import { createSupabaseClient } from './utils/supabase';

// Bot detection for CLICK TRACKING exclusion (comprehensive)
function isTrackingBot(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();
    const bots = [
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'pinterest/0.', 'slackbot', 'telegrambot', 'discordbot', 'googlebot',
        'bingbot', 'yandex', 'duckduckgo', 'baidu',
        'mj12bot', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot',
        'uptimerobot', 'statuscake', 'monitor', 'curl', 'wget', 'python-requests',
        'go-http-client', 'javascript-fetch', 'axios', 'node-fetch'
    ];
    return bots.some(bot => ua.includes(bot));
}

// Bot detection for OG PREVIEW serving (strict social media crawlers)
function isPreviewBot(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();

    // Standard bots - always match
    const standardBots = [
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'pinterest/0.', 'slackbot', 'telegrambot', 'discordbot', 'googlebot',
        'bingbot', 'yandex', 'duckduckgo', 'baidu'
    ];
    if (standardBots.some(bot => ua.includes(bot))) return true;

    // Strict check for Instagram/WhatsApp: only if NO "Mozilla" is present
    // Real in-app browsers ALWAYS have "Mozilla"
    if (!ua.includes('mozilla')) {
        const socialCrawlers = ['instagram', 'whatsapp', 'facebook', 'twitter'];
        if (socialCrawlers.some(bot => ua.includes(bot))) return true;
    }

    return false;
}

// OS Detection
function detectOS(userAgent) {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows phone')) return 'Windows Phone';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('cros')) return 'Chrome OS';
    return 'Unknown';
}

// Browser/App Detection
function detectBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();

    // Social Apps (In-App Browsers) - Priority
    if (ua.includes('fbav') || ua.includes('fban') || ua.includes('fbiab') || ua.includes('facebook')) return 'Facebook';
    if (ua.includes('instagram')) return 'Instagram';
    if (ua.includes('tiktok') || ua.includes('musical_ly')) return 'TikTok';
    if (ua.includes('line')) return 'Line';
    if (ua.includes('whatsapp')) return 'WhatsApp';
    if (ua.includes('snapchat')) return 'Snapchat';
    if (ua.includes('twitter') || ua.includes('cfnetwork')) return 'Twitter';

    // Standard Browsers
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr') && !ua.includes('crios')) return 'Chrome';
    if (ua.includes('crios')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fban') && !ua.includes('fbav')) return 'Safari';
    if (ua.includes('firefox') || ua.includes('fxios')) return 'Firefox';
    if (ua.includes('edg') || ua.includes('edge')) return 'Edge';
    if (ua.includes('opr') || ua.includes('opera')) return 'Opera';
    if (ua.includes('trident') || ua.includes('msie')) return 'Internet Explorer';
    if (ua.includes('ucbrowser') || ua.includes('ucweb')) return 'UC Browser';

    return 'Other';
}

async function recordClick(supabase, link, request) {
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Skip bot tracking (only SEO/scraper bots, NOT in-app browsers)
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

    if (!clickId) {
        clickId = requestUrl.searchParams.get('gclid') ||
            requestUrl.searchParams.get('fbclid');
    }

    const country = request.cf?.country || request.headers.get('x-country') || request.headers.get('cf-ipcountry') || 'XX';

    const getBestIP = () => {
        const h = request.headers;
        const cf = request.cf || {};

        const candidates = [
            h.get('cf-connecting-ip'),
            h.get('x-forwarded-for')?.split(',')[0].trim(),
            cf.clientTcpEdgeIP,
            h.get('true-client-ip'),
            h.get('x-real-ip')
        ];

        const isInternal = (ipAddr) => {
            if (!ipAddr) return true;
            const a = ipAddr.toLowerCase().trim();
            return a.startsWith('2a06:98c0') ||
                a.startsWith('2400:cb00') ||
                a.startsWith('2606:4700') ||
                a.startsWith('108.162.') ||
                a.startsWith('141.101.') ||
                a.startsWith('162.158.') ||
                a.startsWith('172.64.');
        };

        for (const cand of candidates) {
            if (cand && !isInternal(cand)) return cand;
        }

        const xff = h.get('x-forwarded-for');
        if (xff) {
            const parts = xff.split(',').map(s => s.trim());
            for (let i = parts.length - 1; i >= 0; i--) {
                if (parts[i] && !isInternal(parts[i])) return parts[i];
            }
        }

        const fallback = candidates.find(c => c && c.length > 5);
        return fallback || h.get('cf-connecting-ip') || '0.0.0.0';
    };
    const ip = getBestIP();
    const os = detectOS(userAgent);
    let browser = detectBrowser(userAgent);

    if (browser === 'Chrome' || browser === 'Safari' || browser === 'Other' || browser === 'Unknown') {
        const ref = referer.toLowerCase();
        if (ref.includes('instagram') || ref.includes('l.instagram')) browser = 'Instagram';
        else if (ref.includes('facebook') || ref.includes('l.facebook') || ref.includes('lm.facebook')) browser = 'Facebook';
        else if (ref.includes('t.co') || ref.includes('twitter')) browser = 'Twitter';
        else if (ref.includes('linkedin')) browser = 'LinkedIn';
        else if (ref.includes('tiktok')) browser = 'TikTok';
    }

    if (browser === 'Chrome' || browser === 'Safari' || browser === 'Other' || browser === 'Unknown') {
        if (requestUrl.searchParams.has('igshid') || requestUrl.searchParams.has('igsh')) {
            browser = 'Instagram';
        } else if (requestUrl.searchParams.has('fbclid')) {
            browser = 'Facebook';
        } else if (requestUrl.searchParams.has('ttclid')) {
            browser = 'TikTok';
        } else if (requestUrl.searchParams.has('twclid')) {
            browser = 'Twitter';
        }
    }

    try {
        await supabase.from('clicks').insert({
            link_id: link.id,
            slug: link.slug,
            country: country,
            user_agent: userAgent.substring(0, 500),
            ip_address: ip,
            click_id: clickId,
            os: os,
            browser: browser,
            referer: referer
        });
    } catch (err) {
        console.error('Click tracking error:', err);
    }
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
        // Cache for 10 minutes at the Edge to save Cloudflare Worker requests
        headers['Cache-Control'] = 'public, max-age=600, s-maxage=600';
    } else {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
    }

    return headers;
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');

    if (path.startsWith('api/') || path.startsWith('assets/') || path === '' || path.includes('.')) {
        return context.next();
    }

    const supabase = createSupabaseClient(context.env);

    const { data: link, error } = await supabase
        .from('links')
        .select(`
            *,
            domains ( url )
        `)
        .eq('slug', path)
        .single();

    if (error || !link) {
        return context.next();
    }

    const userAgent = context.request.headers.get('user-agent') || '';
    if (!userAgent) {
        return new Response('Access Denied', { status: 403 });
    }

    context.waitUntil(recordClick(supabase, link, context.request));

    const country = context.request.cf?.country || 'XX';
    if (link.block_indonesia && country === 'ID') {
        const domainUrl = link.domains?.url || 'https://google.com';
        const redirectUrl = domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`;
        return Response.redirect(redirectUrl, 302);
    }

    const hasCustomMeta = link.title || link.description || link.image_url;

    if (isPreviewBot(userAgent) && hasCustomMeta) {
        const title = (link.title || 'Link Preview').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const description = (link.description || 'Click to view this link').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const image = link.image_url || '';
        const pageUrl = url.toString();

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="robots" content="noindex, nofollow">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${image ? `<meta property="og:image" content="${image}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${title}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    ${image ? `<meta name="twitter:image" content="${image}">` : ''}
</head>
<body></body>
</html>`;

        return new Response(html, {
            headers: {
                ...getSecurityHeaders(true),
                'Content-Type': 'text/html; charset=utf-8'
            }
        });
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
        } catch (e) { /* ignore if target is invalid URL */ }
    }

    // Clean Redirect with Security Headers + Edge Caching
    return new Response(null, {
        status: 302,
        headers: {
            ...getSecurityHeaders(true),
            'Location': target
        }
    });
}
