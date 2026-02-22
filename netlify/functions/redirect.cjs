const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    user: 'postgres.vkgjvslafnshlsrrcrar',
    password: 'Melpost123@',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// Bot detection
function isBot(userAgent) {
    if (!userAgent) return true; // Treat empty UA as bot/spam
    const ua = userAgent.toLowerCase();
    // Extensive list of bots and crawlers
    const bots = [
        'facebookexternalhit', 'twitterbot', 'whatsapp', 'linkedinbot',
        'pinterest', 'slackbot', 'telegrambot', 'discordbot',
        'yandex', 'duckduckgo', 'baidu', 'ahern', 'instagram',
        'mj12bot', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot'
    ];
    return bots.some(bot => ua.includes(bot));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Detect OS from user agent
function detectOS(userAgent) {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();

    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows phone')) return 'Windows Phone';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('chrome os')) return 'Chrome OS';

    return 'Unknown';
}

exports.handler = async (event, context) => {
    const requestPath = event.path;
    const slug = requestPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const userAgent = event.headers['user-agent'] || '';

    // Anti-Spam: Block requests with no User-Agent immediately
    if (!userAgent || userAgent.trim() === '') {
        return { statusCode: 403, body: 'Access Denied' };
    }

    // ... (rest of valid slug checks) ...

    // Try to find slug in database
    try {
        const result = await pool.query(
            `SELECT l.*, d.url as domain_url 
       FROM links l 
       JOIN domains d ON l.domain_id = d.id 
       WHERE l.slug = $1`,
            [slug]
        );

        // ... (not found check) ...
        if (result.rows.length === 0) {
            // ... returns SPA ...
        }

        // Found the link - handle redirect
        const link = result.rows[0];
        let target = link.original_url;

        // Ensure protocol exists
        if (!target.match(/^https?:\/\//)) {
            target = 'https://' + target;
        }

        const title = escapeHtml(link.title) || 'Link Preview';
        const description = escapeHtml(link.description) || 'Click to view this link';
        const image = escapeHtml(link.image_url) || '';

        // Get visitor info
        const country = event.headers['x-country'] || event.headers['cf-ipcountry'] || 'XX';

        // Robust IP Detection
        const getBestIP = () => {
            const h = event.headers;
            const xff = h['x-forwarded-for'];
            const cfIp = h['cf-connecting-ip'];
            const trueIp = h['true-client-ip'];
            const realIp = h['x-real-ip'];

            const isInternal = (addr) => {
                if (!addr) return true;
                const a = addr.toLowerCase().trim();
                return a.startsWith('2a06:98c0') ||
                    a.startsWith('2400:cb00') ||
                    a.startsWith('2606:4700') ||
                    a.startsWith('108.162.') ||
                    a.startsWith('141.101.') ||
                    a.startsWith('162.158.') ||
                    a.startsWith('172.64.');
            };

            const cands = [];
            if (xff) cands.push(...xff.split(',').map(s => s.trim()));
            if (cfIp) cands.push(cfIp);
            if (trueIp) cands.push(trueIp);
            if (realIp) cands.push(realIp);

            for (const c of cands) {
                if (c && !isInternal(c)) return c;
            }

            // LAST RESORT: Return the first available IP candidate instead of 'unknown'
            const fallback = cands.find(c => c && c.length > 5);
            return fallback || cfIp || h['client-ip'] || 'unknown';
        };

        const clientIP = getBestIP();

        // Extract click_id
        let clickId = null;
        try {
            const targetUrl = new URL(target);
            clickId = targetUrl.searchParams.get('click_id') ||
                targetUrl.searchParams.get('clickid') ||
                targetUrl.searchParams.get('subid') ||
                null;
        } catch (e) { }

        const os = detectOS(userAgent);

        // Record click
        if (!isBot(userAgent)) {
            try {
                await pool.query(
                    `INSERT INTO clicks (link_id, slug, country, user_agent, ip_address, click_id, os) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [link.id, slug, country, userAgent.substring(0, 500), clientIP, clickId, os]
                );
            } catch (err) {
                console.error('Click tracking error:', err.message);
            }
        }

        // GEO-BLOCK: (Feature removed)

        // CLOAKING: Serve OG tags for bots
        if (isBot(userAgent)) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/html' },
                body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${image ? `<meta property="og:image" content="${image}">` : ''}
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    ${image ? `<meta property="twitter:image" content="${image}">` : ''}
</head>
<body></body>
</html>`
            };
        }

        // Direct Redirect (302) - Standard, clean redirect to avoid security flags
        try {
            const finalUrl = new URL(target);
            // If there are search params in the request, merge them
            if (event.queryStringParameters) {
                Object.keys(event.queryStringParameters).forEach(key => {
                    finalUrl.searchParams.set(key, event.queryStringParameters[key]);
                });
            }
            target = finalUrl.toString();
        } catch (e) {
            console.error('URL Parsing Error:', e);
        }

        return {
            statusCode: 302,
            headers: {
                'Location': target,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        };

    } catch (error) {
        console.error('Redirect error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>500 Internal Server Error</h1><p>' + error.message + '</p>'
        };
    }
};
