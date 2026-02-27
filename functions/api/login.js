// Simple authentication - change these credentials!
// ideally move to env vars, but keeping as is for direct port
const VALID_USERS = {
    'ngeteam': 'NGEteam25!',
    'nge': 'supersecret123'
};

import { createSupabaseClient } from '../utils/supabase';

// Generate simple token
function generateToken(username) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const str = `${username}:${timestamp}:${random}`;
    // Cloudflare Workers support btoa
    try {
        return btoa(str);
    } catch (e) {
        // Fallback for non-latin characters (though unlikely here)
        return btoa(unescape(encodeURIComponent(str)));
    }
}

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { username, password } = await context.request.json();

        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, error: 'Username and password required' }), { status: 400, headers });
        }

        // 1. Check Admin Credentials
        if (username === 'ngeteam') {
            let adminPass = 'NGEteam25!';
            try {
                const { data } = await supabase.from('settings').select('value').eq('key', 'admin_password').single();
                if (data?.value) adminPass = data.value;
            } catch (e) { }

            if (password === adminPass) {
                const token = generateToken(username);
                return new Response(JSON.stringify({
                    success: true,
                    role: 'admin',
                    token,
                    message: 'Admin login successful'
                }), { status: 200, headers });
            }
        }

        // 2. Check Team Member Credentials
        const { data: teamMember, error: teamError } = await supabase
            .from('team')
            .select('*')
            .eq('user_id', username)
            .eq('password', password)
            .maybeSingle();

        if (teamMember) {
            const token = generateToken(username);
            return new Response(JSON.stringify({
                success: true,
                role: 'member',
                token,
                message: 'Team login successful'
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ success: false, error: 'Invalid username or password' }), { status: 401, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'Server error: ' + error.message }), { status: 500, headers });
    }
}

// Handle OPTIONS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
