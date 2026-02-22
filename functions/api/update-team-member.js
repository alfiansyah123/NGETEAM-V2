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
        if (old_user_id) {
            // 2a. Update ONLY the primary link (Slug change)
            // The primary link is the one where the slug matches the old_user_id
            const { error: primaryError } = await supabase
                .from('links')
                .update({
                    slug: user_id,
                    user_id: user_id,
                    original_url: target_url
                })
                .eq('slug', old_user_id);

            if (primaryError) console.warn('Primary link update failed:', primaryError);

            // 2b. Update ALL other links associated with this member
            // This ensures old generated links now redirect to the new target_url
            const { error: linksError } = await supabase
                .from('links')
                .update({
                    original_url: target_url,
                    user_id: user_id // Keep user_id in sync if it changed
                })
                .eq('user_id', old_user_id);

            if (linksError) {
                console.warn('Mass link update failed:', linksError);
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
