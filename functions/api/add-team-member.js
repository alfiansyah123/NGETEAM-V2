import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { name, user_id, password } = await context.request.json();

        if (!name || !user_id || !password) {
            return new Response(JSON.stringify({ error: 'Name, User ID, and Password are required' }), { status: 400, headers });
        }

        const { data, error } = await supabase
            .from('team')
            .insert({ name, user_id, password })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return new Response(JSON.stringify({ error: 'User ID already exists' }), { status: 400, headers });
            }
            throw error;
        }

        return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });

    } catch (error) {
        console.error('Error adding team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
