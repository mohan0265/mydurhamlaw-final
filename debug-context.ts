
require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { enhanceDurmahContext } from './src/lib/durmah/contextBuilderEnhanced';

async function main() {
    console.log('Starting debug...');
    
    // MOCK or REAL config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = 'dfd8c691-6183-55a1-bbec-0fa1273c3130'; // From screenshot toast if visible, else use a real UUID from DB
    // Toast log: conversationId: 'dfd8c691...', user: true
    // Wait, the user ID is likely the auth user. I'll need a real ID.
    // I can query one.
    
    const { data: users } = await supabase.from('auth.users').select('id').limit(1); // Won't work on client client usually
    // Actually, I'll just use a random UUID if I can't find one, or hardcode one I saw in logs. 
    // The screenshot has a `user_id` in the `durmah_messages` table? No unique ID visible.
    // I'll try to find a user ID from `profiles` or similar if possible.
    
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    const targetId = profile?.id || '00000000-0000-0000-0000-000000000000';
    console.log('Testing with User ID:', targetId);

    const baseCtx = { 
        student: { displayName: '', yearGroup: '', term: '', weekOfTerm: 0, localTimeISO: new Date().toISOString() },
        assignments: { upcoming: [], overdue: [], recentlyCreated: [], total: 0 },
        schedule: { todaysClasses: [] }
    };

    try {
        console.log('Calling enhanceDurmahContext...');
        const ctx = await enhanceDurmahContext(supabase, targetId, baseCtx as any, undefined, undefined);
        console.log('Context built successfully:', JSON.stringify(ctx, null, 2));
    } catch (e: any) {
        console.error('CRASHED:', e);
        console.error(e.stack);
    }
}

main();
