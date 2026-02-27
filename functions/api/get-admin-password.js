import { createSupabaseClient } from '../utils/supabase';

// Get current admin password
export async function onRequestGet(context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const supabase = createSupabaseClient(context.env);

        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error;
        }

        // Default if not set
        const password = data?.value || 'NGEteam25!';

        return new Response(JSON.stringify({ success: true, password }), { status: 200, headers });

    } catch (error) {
        console.error('Error fetching password:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch password' }), { status: 500, headers });
    }
}
