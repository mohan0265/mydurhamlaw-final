import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getYear } from '@/lib/syllabus/fetch';
import WeekDetails from '@/components/planner/WeekDetails';
import { fmtRange } from '@/lib/date/format';

export default function WeekPage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    const [, y, t, , n] = window.location.pathname.split('/').filter(Boolean);
    const year = Number(y), term = String(t), week = Number(n);
    getYear(year).then((res) => {
      if (!res.available) return setState({ error: true });
      const tt = res.year?.terms.find(tt => tt.slug === term);
      const ww = tt?.weeks.find((w:any) => w.week_no === week);
      setState({ year, term: tt, week: ww });
    });
  }, []);

  if (!state) return null;
  if (state.error) return <div className="max-w-5xl mx-auto px-4 py-8 text-red-600">Unable to load week.</div>;
  const { year, term, week } = state;

  return (
    <>
      <Head><title>{term?.name ?? 'Term'} · Week {week?.week_no ?? ''}</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-gray-500">
          <a className="hover:underline" href={`/planner/${year}`}>Year {year}</a> ›
          <a className="hover:underline ml-1" href={`/planner/${year}/${term?.slug}`}>{term?.name ?? 'Term'}</a> ›
          <span className="ml-1">Week {week?.week_no}</span>
        </div>

        <h2 className="text-xl font-semibold">{term?.name ?? 'Term'} · Week {week?.week_no}</h2>
        {week && <p className="text-gray-500">{fmtRange(week.start_date, week.end_date)}</p>}

        {week ? (
          <div className="mt-6">
            <WeekDetails weekNo={week.week_no} startISO={week.start_date} endISO={week.end_date} topics={week.topics}/>
          </div>
        ) : (
          <div className="mt-6 text-gray-500">No topics published for this week yet.</div>
        )}
      </div>
    </>
  );
}