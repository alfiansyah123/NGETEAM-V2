import { createSupabaseClient } from '../utils/supabase';

export async function onRequestGet(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        console.log('API get-team started');
        // Step 1: Fetch all team members
        const { data: team, error: teamError } = await supabase
            .from('team')
            .select('*')
            .order('name', { ascending: true });

        if (teamError) {
            console.error('Supabase teamError:', teamError);
            throw teamError;
        }

        if (!team || team.length === 0) {
            return new Response(JSON.stringify({ success: true, team: [] }), { status: 200, headers });
        }

        // Step 2: Fetch corresponding links for these team members
        const userIds = team.map(t => t.user_id).filter(id => !!id);
        let links = [];

        if (userIds.length > 0) {
            const { data: linksData, error: linksError } = await supabase
                .from('links')
                .select('slug, original_url, user_id')
                .in('user_id', userIds);

            if (!linksError) {
                links = linksData || [];
            } else {
                console.warn('Optional links fetch failed:', linksError);
            }
        }

        // Merge data
        const mergedTeam = team.map(member => {
            const linkData = links.find(l => l.user_id === member.user_id);
            return {
                ...member,
                links: linkData ? { original_url: linkData.original_url } : null
            };
        });

        return new Response(JSON.stringify({ success: true, team: mergedTeam }), { status: 200, headers });

    } catch (error) {
        console.error('Database error in get-team:', error);
        const detailedError = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch team: ' + detailedError }), { status: 500, headers });
    }
}
