import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { id, name, user_id, password, target_url, old_user_id } = await context.request.json();

        if (!id || !name || !user_id || !password) {
            return new Response(JSON.stringify({ error: 'ID, Name, User ID, and Password are required' }), { status: 400, headers });
        }

        // Step 1: Update Team Table
        const { error: teamError } = await supabase
            .from('team')
            .update({ name, user_id, password })
            .eq('id', id);

        if (teamError) throw teamError;

        // Step 2: Update Links Table
        // We use the old_user_id to find the correct link to update
        if (old_user_id) {
            const { error: linkError } = await supabase
                .from('links')
                .update({
                    slug: user_id,
                    user_id: user_id,
                    original_url: target_url
                })
                .eq('user_id', old_user_id);

            if (linkError) {
                console.warn('Link update failed or no link found:', linkError);
                // We don't throw here to allow the team update to persist even if link fails
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
