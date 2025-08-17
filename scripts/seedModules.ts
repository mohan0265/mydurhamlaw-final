/**
 * Seed Durham academic planner data into Supabase from CSVs.
 * Usage:
 *   export SUPABASE_URL="https://<project>.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="<service_role>"
 *   npx ts-node scripts/seedModules.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseCSV(filePath: string): string[][] {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return raw.split(/\r?\n/).map((line) => {
    // naive CSV split that handles simple commas; OK for our template
    // if your titles contain commas, swap in a real CSV parser (csv-parse)
    return line.split(',').map((s) => s.trim());
  });
}

async function upsertTerms(csvPath: string) {
  const rows = parseCSV(csvPath);
  const header = rows.shift()!;
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const r of rows) {
    const record = {
      academic_year: r[idx.academic_year],
      term_code: r[idx.term_code],
      term_name: r[idx.term_name],
      start_date: r[idx.start_date],
      end_date: r[idx.end_date],
      notes: r[idx.notes] || '',
    };

    const { error } = await supabase.from('terms')
      .upsert(record, { onConflict: 'academic_year,term_code' });
    if (error) throw error;
  }
}

async function upsertModules(csvPath: string) {
  const rows = parseCSV(csvPath);
  const header = rows.shift()!;
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const r of rows) {
    if (!r.length || r[0].startsWith('#') || r[0] === '') continue;

    const record = {
      academic_year: r[idx.academic_year],
      year_of_study: Number(r[idx.year_of_study]),
      module_code: r[idx.module_code],
      module_title: r[idx.module_title],
      compulsory: (r[idx.compulsory] || '').toLowerCase() === 'true',
      credits: Number(r[idx.credits] || 20),
    };

    const { error } = await supabase.from('modules')
      .upsert(record, { onConflict: 'academic_year,module_code' });
    if (error) throw error;
  }
}

async function linkModuleTerms(csvPath: string) {
  const rows = parseCSV(csvPath);
  const header = rows.shift()!;
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const r of rows) {
    if (!r.length || r[0].startsWith('#') || r[0] === '') continue;

    const academic_year = r[idx.academic_year];
    const module_code = r[idx.module_code];
    const term_code = r[idx.term_code];

    // fetch ids
    const { data: m, error: em } = await supabase
      .from('modules')
      .select('id')
      .eq('academic_year', academic_year)
      .eq('module_code', module_code)
      .single();
    if (em || !m) throw new Error(`Module not found: ${academic_year}/${module_code}`);

    const { data: t, error: et } = await supabase
      .from('terms')
      .select('id')
      .eq('academic_year', academic_year)
      .eq('term_code', term_code)
      .single();
    if (et || !t) throw new Error(`Term not found: ${academic_year}/${term_code}`);

    const payload = {
      module_id: m.id,
      term_id: t.id,
      teaching_weeks: Number(r[idx.teaching_weeks] || 10),
      assessment_in_term: (r[idx.assessment_in_term] || '').toLowerCase() === 'true',
    };

    const { error } = await supabase.from('module_terms')
      .upsert(payload, { onConflict: 'module_id,term_id' });
    if (error) throw error;
  }
}

async function upsertAssessments(csvPath: string) {
  const rows = parseCSV(csvPath);
  const header = rows.shift()!;
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const r of rows) {
    if (!r.length || r[0].startsWith('#') || r[0] === '') continue;

    const academic_year = r[idx.academic_year];
    const module_code = r[idx.module_code];

    const { data: m, error: em } = await supabase
      .from('modules')
      .select('id')
      .eq('academic_year', academic_year)
      .eq('module_code', module_code)
      .single();
    if (em || !m) throw new Error(`Module not found for assessment: ${academic_year}/${module_code}`);

    const payload = {
      module_id: m.id,
      assessment_name: r[idx.assessment_name],
      assessment_type: r[idx.assessment_type],
      weight_percent: Number(r[idx.weight_percent]),
      window_start: r[idx.window_start] || null,
      window_end: r[idx.window_end] || null,
      due_date: r[idx.due_date] || null,
      due_time: r[idx.due_time] || null,
      notes: r[idx.notes] || '',
    };

    const { error } = await supabase.from('assessments').insert(payload);
    if (error) throw error;
  }
}

(async () => {
  try {
    const root = process.cwd();
    await upsertTerms(path.join(root, 'data/terms.csv'));
    await upsertModules(path.join(root, 'data/modules.csv'));
    await linkModuleTerms(path.join(root, 'data/module_terms.csv'));
    await upsertAssessments(path.join(root, 'data/assessments.csv'));
    console.log('Seed complete ✅');
  } catch (e) {
    console.error('Seed failed ❌', e);
    process.exit(1);
  }
})();

