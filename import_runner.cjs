const fs = require('fs');
const http = require('http');

const sql = fs.readFileSync('database/remote_export.sql', 'utf8');

const req = http.request({
    hostname: '127.0.0.1',
    port: 8788,
    path: '/api/bulk-import',
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(sql)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(sql);
req.end();
