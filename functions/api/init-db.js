export async function onRequest(context) {
    const db = context.env.DB;
    const schema = `
        CREATE TABLE IF NOT EXISTS domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS team (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user_id TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            original_url TEXT NOT NULL,
            title TEXT,
            description TEXT,
            image_url TEXT,
            domain_id INTEGER,
            user_id TEXT,
            block_indonesia BOOLEAN DEFAULT 0,
            url_trafee TEXT,
            routing_mode TEXT DEFAULT 'random',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            link_id INTEGER,
            slug TEXT,
            country TEXT,
            city TEXT,
            ip_address TEXT,
            user_agent TEXT,
            referer TEXT,
            os TEXT,
            device TEXT,
            browser TEXT,
            click_id TEXT,
            user_id TEXT,
            tracker_name TEXT,
            s3 TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            smartlink TEXT,
            network TEXT,
            leads INTEGER DEFAULT 0,
            payout REAL DEFAULT 0.0,
            date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        const statements = schema.split(';').filter(s => s.trim().length > 0);
        for (const stmt of statements) {
            await db.prepare(stmt).run();
        }

        // Insert default domains if needed
        await db.prepare(`INSERT OR IGNORE INTO domains (url) VALUES ('l.404family.com'), ('link.example.com')`).run();

        // Insert a test user so the team page doesn't error out when fetching relations
        await db.prepare(`INSERT OR IGNORE INTO team (name, user_id, password) VALUES ('Test User', 'testuser', '123456')`).run();

        return new Response('Database Initialized Successfully!', { status: 200 });
    } catch (err) {
        return new Response('Error: ' + err.message, { status: 500 });
    }
}
