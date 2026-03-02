import { createSupabaseClient } from '../utils/supabase';

export async function onRequestGet(context) {
    const supabase = createSupabaseClient(context.env);
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300' // Cache for 5 mins
    };

    try {
        const { data: domainsData, error } = await supabase
            .from('domains')
            .select('url')
            .eq('active', true)
            .order('url', { ascending: true });

        if (error) throw error;

        const domains = domainsData.map(d => d.url);

        return new Response(JSON.stringify({ domains }), { status: 200, headers });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch domains: ' + error.message }), { status: 500, headers });
    }
}
