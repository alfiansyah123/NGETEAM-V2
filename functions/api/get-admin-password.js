import { createSupabaseClient } from '../utils/supabase';

// Get current admin password
export async function onRequestGet(context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const supabase = createSupabaseClient(context.env);
        let password = 'NGEteam25!';

        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'admin_password')
                .single();

            if (!error && data?.value) {
                password = data.value;
            }
        } catch (dbError) {
            console.warn('Could not fetch admin password from DB, using default.', dbError);
        }

        return new Response(JSON.stringify({ success: true, password }), { status: 200, headers });

    } catch (error) {
        console.error('Error fetching password:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch password' }), { status: 500, headers });
    }
}
