<?php
// Router for PHP built-in server
// Run with: php -S localhost:8000 router.php

// Adjust path handling for subdirectories (e.g. /gen/)
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$script_path = dirname($_SERVER['SCRIPT_NAME']); // returns /gen or /

// Remove the subfolder path from the URI to get the clean slug
if ($script_path !== '/' && strpos($request_uri, $script_path) === 0) {
    $slug = substr($request_uri, strlen($script_path));
} else {
    $slug = $request_uri;
}

$slug = ltrim($slug, '/'); // remove leading slash

if (empty($slug)) {
    // If root /, serve index.html or just show message
    // Since we are running separate frontend, maybe just 404 or message
    echo "Link Generator Backend Running. Access frontend via Vite.";
    exit;
}

// Debugging
ini_set('display_errors', 0); // Disable display errors to not mess up HTML output
error_reporting(E_ALL);

function is_bot() {
    $userAgent = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    $bots = [
        'facebookexternalhit', 'twitterbot', 'whatsapp', 'linkedinbot', 
        'pinterest', 'slackbot', 'telegrambot', 'discordbot', 'googlebot', 
        'bingbot', 'yandex', 'duckduckgo'
    ];
    
    foreach ($bots as $bot) {
        if (strpos($userAgent, $bot) !== false) {
            return true;
        }
    }
    return false;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM links WHERE slug = ?");
    $stmt->execute([$slug]);
    $link = $stmt->fetch();

    if ($link) {
        $target = $link['original_url'];
        
        // Ensure protocol exists
        if (!preg_match('#^https?://#', $target)) {
            $target = 'https://' . $target;
        }

        // Get Metadata
        $title = htmlspecialchars($link['title'] ?? 'Link Preview');
        $description = htmlspecialchars($link['description'] ?? 'Click to view this link');
        $image = htmlspecialchars($link['image_url'] ?? '');

        // CLOAKING LOGIC
        if (is_bot()) {
            // SERVE SAFE PREVIEW FOR BOTS (No Redirect)
            ?>
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title><?= $title ?></title>
                <meta name="description" content="<?= $description ?>">
                
                <!-- Open Graph / Facebook -->
                <meta property="og:type" content="website">
                <meta property="og:title" content="<?= $title ?>">
                <meta property="og:description" content="<?= $description ?>">
                <?php if ($image): ?>
                <meta property="og:image" content="<?= $image ?>">
                <?php endif; ?>

                <!-- Twitter -->
                <meta property="twitter:card" content="summary_large_image">
                <meta property="twitter:title" content="<?= $title ?>">
                <meta property="twitter:description" content="<?= $description ?>">
                <?php if ($image): ?>
                <meta property="twitter:image" content="<?= $image ?>">
                <?php endif; ?>
            </head>
            <body>
            </body>
            </html>
            <?php
            exit;
        } else {
        // Direct Redirect (302) to avoid security flags
        $params = $_GET;
        if (!empty($params)) {
            $separator = (strpos($target, '?') === false) ? '?' : '&';
            $target .= $separator . http_build_query($params);
        }
        
        header("Location: " . $target, true, 302);
        exit;
        }

    } else {
        // 404 Not Found
        http_response_code(404);
        echo "<h1>404 Not Found</h1><p>Link invalid or expired.</p>";
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo "Internal Server Error";
}
?>
