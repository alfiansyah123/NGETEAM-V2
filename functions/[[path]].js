import { createSupabaseClient } from './utils/supabase';

// Bot detection for CLICK TRACKING exclusion (narrow - only SEO/scraper bots)
// Does NOT include social media in-app browsers (Instagram, Facebook, WhatsApp)
function isTrackingBot(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();
    const bots = [
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'pinterest/0.', 'slackbot', 'telegrambot', 'discordbot', 'googlebot',
        'bingbot', 'yandex', 'duckduckgo', 'baidu',
        'mj12bot', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot'
    ];
    return bots.some(bot => ua.includes(bot));
}

// Bot detection for OG PREVIEW serving (social media crawlers only)
// Key: Instagram/WhatsApp CRAWLERS don't have 'Mozilla' in their UA,
// but their IN-APP BROWSERS do. So we only match them when no 'Mozilla' present.
function isPreviewBot(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();

    // Standard bots - always match regardless of Mozilla
    const standardBots = [
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'pinterest/0.', 'slackbot', 'telegrambot', 'discordbot', 'googlebot',
        'bingbot', 'yandex', 'duckduckgo', 'baidu',
        'mj12bot', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot'
    ];
    if (standardBots.some(bot => ua.includes(bot))) return true;

    // Social media crawlers - only match if NOT a real browser (no Mozilla = crawler)
    // e.g. "WhatsApp/2.23.xx" = crawler ✅, "Mozilla/5.0 ... Instagram 275.0 ..." = in-app browser ❌
    if (!ua.includes('mozilla')) {
        const socialCrawlers = ['instagram', 'whatsapp'];
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
    // Facebook: FBAV (iOS), FBAN (Android), FBIAB (In-App Browser)
    if (ua.includes('fbav') || ua.includes('fban') || ua.includes('fbiab') || ua.includes('facebook')) return 'Facebook';
    if (ua.includes('instagram')) return 'Instagram';
    if (ua.includes('tiktok') || ua.includes('musical_ly')) return 'TikTok'; // musical_ly is old tiktok
    if (ua.includes('line')) return 'Line';
    if (ua.includes('whatsapp')) return 'WhatsApp';
    if (ua.includes('snapchat')) return 'Snapchat';
    if (ua.includes('twitter') || ua.includes('cfnetwork')) return 'Twitter'; // CFNetwork sometimes indicates iOS app

    // Standard Browsers
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr') && !ua.includes('crios')) return 'Chrome';
    if (ua.includes('crios')) return 'Chrome'; // Chrome on iOS
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

    // 1. Extract explicit click_id from Request URL (Dynamic - Highest Priority)
    const requestUrl = new URL(request.url);
    let clickId = requestUrl.searchParams.get('click_id') ||
        requestUrl.searchParams.get('clickid') ||
        requestUrl.searchParams.get('subid');

    // 2. If no explicit ID in request, check Target URL (Static/Hardcoded - Medium Priority)
    if (!clickId && link.original_url) {
        try {
            const targetUrl = new URL(link.original_url);
            clickId = targetUrl.searchParams.get('click_id') ||
                targetUrl.searchParams.get('clickid') ||
                targetUrl.searchParams.get('subid');
        } catch (e) { /* ignore */ }
    }

    // 3. Fallback to Ad Network IDs (Lowest Priority - only if no other ID exists)
    // This prevents fbclid/gclid from overwriting a hardcoded "ALCEMEIST-noGEN"
    if (!clickId) {
        clickId = requestUrl.searchParams.get('gclid') ||
            requestUrl.searchParams.get('fbclid');
    }

    const country = request.cf?.country || 'XX';
    // Final Robust IP Seeker: Dives into request.cf and chain headers
    const getBestIP = () => {
        const h = request.headers;
        const cf = request.cf || {};

        // Potential sources in priority
        const candidates = [
            h.get('cf-connecting-ip'),
            h.get('x-forwarded-for')?.split(',')[0].trim(),
            cf.clientTcpEdgeIP,
            h.get('true-client-ip'),
            h.get('x-real-ip')
        ];

        // Filter out known Cloudflare proxy ranges
        const isInternal = (ip) => {
            if (!ip) return true;
            return ip.startsWith('2a06:98c0') || ip.startsWith('2400:cb00') || ip.startsWith('2606:4700') || ip === '2a06:98c0:3600::103';
        };

        for (const cand of candidates) {
            if (cand && !isInternal(cand)) return cand;
        }

        // Emergency fallback: If everything is masked, try the LAST element of XFF (sometimes it works)
        const xff = h.get('x-forwarded-for');
        if (xff && xff.includes(',')) {
            const parts = xff.split(',').map(s => s.trim());
            const last = parts[parts.length - 1];
            if (last && !isInternal(last)) return last;
        }

        return h.get('cf-connecting-ip') || '0.0.0.0';
    };

    const ip = getBestIP();

    // Diagnostic info (hidden in UA string but won't break dashboard look)
    const finalUA = userAgent.substring(0, 500);
    const os = detectOS(userAgent);
    let browser = detectBrowser(userAgent);

    // Fallback 1: If browser is generic but Referrer indicates a social platform, use that.
    if (browser === 'Chrome' || browser === 'Safari' || browser === 'Other' || browser === 'Unknown') {
        const ref = referer.toLowerCase();
        if (ref.includes('instagram') || ref.includes('l.instagram')) browser = 'Instagram';
        else if (ref.includes('facebook') || ref.includes('l.facebook') || ref.includes('lm.facebook')) browser = 'Facebook';
        else if (ref.includes('t.co') || ref.includes('twitter')) browser = 'Twitter';
        else if (ref.includes('linkedin')) browser = 'LinkedIn';
        else if (ref.includes('tiktok')) browser = 'TikTok';
    }

    // Fallback 2: Check URL query params added by social platforms
    // Instagram adds ?igshid= or ?igsh=, Facebook adds ?fbclid=
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
            user_agent: finalUA,
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

export async function onRequest(context) {
    const supabase = createSupabaseClient(context.env);

    const url = new URL(context.request.url);
    const path = url.pathname.replace(/^\//, '');

    // 0. Handle /t/ prefix (Team Links & Team Generator)
    let lookUpSlug = path;
    if (path.startsWith('t/')) {
        const segments = path.split('/');
        lookUpSlug = segments[1]; // Get the ID after /t/
    }

    // SPECIAL BYPASS: If slug matches a Team Member ID, serve the generator (frontend)
    if (lookUpSlug) {
        const { data: teamMember } = await supabase
            .from('team')
            .select('id')
            .eq('user_id', lookUpSlug)
            .maybeSingle();

        if (teamMember) {
            // It's a team member visiting their generator link!
            return context.next();
        }
    }

    // 1. Fetch Link
    const { data: link, error } = await supabase
        .from('links')
        .select(`
            *,
            domains ( url )
        `)
        .eq('slug', lookUpSlug)
        .single();

    if (error || !link) {
        // Not found -> pass to frontend (SPA 404/Generator)
        return context.next();
    }

    // 2. Anti-Spam / Bot Check
    const userAgent = context.request.headers.get('user-agent');
    if (!userAgent) {
        return new Response('Access Denied', { status: 403 });
    }

    // 3. Track Click (Non-blocking)
    context.waitUntil(recordClick(supabase, link, context.request));

    // 4. Geo Blocking
    const country = context.request.cf?.country || 'XX';
    // Simplified: Link Share / Block Indo feature removed

    // 5. Cloaking: Serve OG meta tags for bots (social media preview)
    // Only intercept bots if user has set custom metadata (title, description, or image_url)
    // If no custom metadata, let bots follow redirect to target site's own OG tags
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
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }

    // 6. Final Redirect (for real users)
    let target = link.original_url;
    // Append query params from request to target
    if (url.search) {
        const targetUrl = new URL(target);
        const requestParams = new URL(context.request.url).searchParams;
        requestParams.forEach((value, key) => {
            targetUrl.searchParams.append(key, value);
        });
        target = targetUrl.toString();
    }

    return Response.redirect(target, 302);
}
