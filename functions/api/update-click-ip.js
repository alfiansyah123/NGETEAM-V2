import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);

    try {
        const { click_id, ip_address } = await context.request.json();

        if (!click_id || !ip_address) {
            return new Response('Missing parameters', { status: 400 });
        }

        // Update the click record with the true client IP provided by the frontend
        const { error } = await supabase
            .from('clicks')
            .update({ ip_address: ip_address })
            .eq('id', click_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('IP Update error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
