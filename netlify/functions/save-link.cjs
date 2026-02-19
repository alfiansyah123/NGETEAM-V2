const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    user: 'postgres.vkgjvslafnshlsrrcrar',
    password: 'Melpost123@',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);

        const { slug, original_url, domain_url, title, description, image_url } = data;

        if (!slug || !original_url || !domain_url) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: slug, original_url, domain_url' })
            };
        }

        // Get domain_id
        const domainResult = await pool.query('SELECT id FROM domains WHERE url = $1', [domain_url]);

        if (domainResult.rows.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Domain not found' })
            };
        }

        const domain_id = domainResult.rows[0].id;

        // Insert link
        await pool.query(
            `INSERT INTO links (slug, original_url, domain_id, title, description, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [slug, original_url, domain_id, title || null, description || null, image_url || null]
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, slug })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to save link: ' + error.message })
        };
    }
};
