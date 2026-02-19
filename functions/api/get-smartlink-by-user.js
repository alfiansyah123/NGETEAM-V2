import { createSupabaseClient } from '../utils/supabase';

export async function onRequestGet(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers });
    }

    try {
        // Step 1: Fetch team member - using ILIKE for case-insensitivity
        const { data: team, error: teamError } = await supabase
            .from('team')
            .select('*')
            .ilike('user_id', userId)
            .maybeSingle();

        if (teamError) throw teamError;

        if (!team) {
            return new Response(JSON.stringify({ error: 'Team member not found' }), { status: 404, headers });
        }

        // Step 2: Fetch associated link for this team member
        const { data: link, error: linkError } = await supabase
            .from('links')
            .select('original_url')
            .eq('user_id', team.user_id)
            .maybeSingle();

        return new Response(JSON.stringify({
            success: true,
            data: {
                name: team.name,
                user_id: team.user_id,
                target_url: link?.original_url || null
            }
        }), { status: 200, headers });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch smartlink: ' + error.message }), { status: 500, headers });
    }
}
