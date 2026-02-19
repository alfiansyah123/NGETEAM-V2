import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (env) => {
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment');
    }
    return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
};
