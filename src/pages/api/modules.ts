import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // 1. Fetch User Modules (Canonical)
    const { data: userModules, error } = await supabase
      .from('user_modules')
      .select(`
        id, 
        catalog_id, 
        status, 
        module:module_catalog(id, title, code, term, year_level, credits, is_core)
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    if (error) return res.status(500).json({ error: error.message });

    // 2. Auto-Enrollment Fallback (First Time User)
    if (!userModules || userModules.length === 0) {
       console.log('No modules found. Attempting auto-enrollment...');
       
       // Get User Profile to know Year
       const { data: profile } = await supabase.from('profiles').select('year_of_study').eq('id', session.user.id).single();
       const targetYear = profile?.year_of_study || 1; // Default to Year 1

       // Fetch Core Modules for that Year
       const { data: coreModules } = await supabase
          .from('module_catalog')
          .select('id')
          .eq('year_level', targetYear)
          .eq('is_core', true);
       
       if (coreModules && coreModules.length > 0) {
           const enrollments = coreModules.map(m => ({
               user_id: session.user.id,
               catalog_id: m.id,
               status: 'active'
           }));
           
           const { error: seedError } = await supabase.from('user_modules').insert(enrollments);
           if (!seedError) {
               // Refetch to return populated list
               const { data: refreshed } = await supabase
                  .from('user_modules')
                  .select(`id, catalog_id, status, module:module_catalog(id, title, code, term, year_level, credits, is_core)`)
                  .eq('user_id', session.user.id)
                  .eq('status', 'active');
               
               // Map to flatten structure for frontend
               const flattened = (refreshed || []).map((row: any) => ({
                   id: row.module.id, // Use catalog ID as the primary module ID in frontend
                   user_module_id: row.id,
                   title: row.module.title,
                   code: row.module.code,
                   term: row.module.term,
                   year_level: row.module.year_level
               }));
               return res.status(200).json(flattened);
           }
       }
    }

    // Map to flatten structure for frontend
    const flattened = (userModules || []).map((row: any) => ({
        id: row.module.id, 
        user_module_id: row.id,
        title: row.module.title,
        code: row.module.code,
        term: row.module.term,
        year_level: row.module.year_level
    })).sort((a: any, b: any) => a.title.localeCompare(b.title));

    return res.status(200).json(flattened);
  }

  // Handle enrollment via POST?
  if (req.method === 'POST') {
     const { catalog_id } = req.body;
     if (!catalog_id) return res.status(400).json({ error: 'Catalog ID required' });
     
     const { data, error } = await supabase.from('user_modules').insert({
         user_id: session.user.id,
         catalog_id,
         status: 'active'
     }).select().single();
     
     if (error) return res.status(500).json({ error: error.message });
     return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
