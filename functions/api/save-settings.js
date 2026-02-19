
import { createSupabaseClient } from '../utils/supabase';

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { key, value } = body;

    if (key === undefined || key === null || value === undefined || value === null) {
        return new Response(JSON.stringify({ error: 'Missing key or value (can be empty string, but not null/undefined)' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const supabase = createSupabaseClient(env);

    const { error } = await supabase
        .from('settings')
        .upsert({ key, value }); // Remove updated_at to be safe if column doesn't exist

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
