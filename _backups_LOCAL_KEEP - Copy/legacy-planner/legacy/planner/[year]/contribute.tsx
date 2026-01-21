import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { addStudentTopic } from '@/lib/syllabus/fetch';

export default function ContributePage() {
  const [year, setYear] = useState<number>(1);
  const [userId, setUserId] = useState<string>('');
  const [form, setForm] = useState({ term:'michaelmas', week:1, module_code:'', day:'Mon', title:'', notes:'' });
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    const y = Number(window.location.pathname.split('/').filter(Boolean)[1]); setYear(y);
    (async () => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  async function submit(e:any) {
    e.preventDefault();
    if (!userId) { setMsg('Please sign in.'); return; }
    const res = await addStudentTopic({
      userId,
      year,
      term: form.term,
      week: Number(form.week),
      module_code: form.module_code,
      day: form.day as any,
      title: form.title,
      notes: form.notes
    });
    setMsg(res.ok ? 'Saved. Marked as Student-provided.' : 'Could not save.');
  }

  return (
    <>
      <Head><title>Contribute details · Year {year}</title></Head>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Add your own week details</h1>
        <p className="text-sm text-gray-600 mt-2">
          These entries are for your personal planning and will appear as <b>Student-provided</b> until the official schedule is published.
          We never fabricate content.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Term
              <select className="block w-full border rounded p-2" value={form.term} onChange={e=>setForm({...form, term:e.target.value})}>
                <option value="michaelmas">Michaelmas</option>
                <option value="epiphany">Epiphany</option>
                <option value="easter">Easter</option>
              </select>
            </label>
            <label className="text-sm">Week
              <input type="number" className="block w-full border rounded p-2" value={form.week} onChange={e=>setForm({...form, week:Number(e.target.value)})}/>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Module code
              <input className="block w-full border rounded p-2" value={form.module_code} onChange={e=>setForm({...form, module_code:e.target.value})}/>
            </label>
            <label className="text-sm">Day
              <select className="block w-full border rounded p-2" value={form.day} onChange={e=>setForm({...form, day:e.target.value as any})}>
                <option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option>
              </select>
            </label>
          </div>

          <label className="text-sm">Topic title
            <input className="block w-full border rounded p-2" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
          </label>

          <label className="text-sm">Notes (optional)
            <textarea className="block w-full border rounded p-2" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
          </label>

          <button className="px-4 py-2 rounded border hover:bg-gray-50" type="submit">Save</button>
          {msg && <div className="text-sm mt-2">{msg}</div>}
        </form>
      </div>
    </>
  );
}