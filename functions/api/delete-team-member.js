import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { id } = await context.request.json();

        if (!id) {
            return new Response(JSON.stringify({ error: 'Member ID is required' }), { status: 400, headers });
        }

        const { error } = await supabase
            .from('team')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error deleting team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
