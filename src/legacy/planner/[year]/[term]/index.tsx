import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getYear } from '@/lib/syllabus/fetch';
import { fmtRange } from '@/lib/date/format';

export default function TermPage() {
  const [year, setYear] = useState<number | null>(null);
  const [term, setTerm] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const [, y, t] = window.location.pathname.split('/').filter(Boolean);
    const yr = Number(y); 
    setYear(yr); 
    setTerm(t || ''); // Provide fallback for undefined
    getYear(yr).then((res) => {
      if (res.available) setData(res.year?.terms.find(tt => tt.slug === t));
    });
  }, []);

  if (!year || !term) return null;

  return (
    <>
      <Head><title>{data ? `${data.name} · Year ${year}` : `Year ${year}`}</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-gray-500"><a className="hover:underline" href={`/planner/${year}`}>Year {year}</a> › {data?.name ?? term}</div>
        <h2 className="text-xl font-semibold">{data?.name ?? 'Term'}</h2>
        {data && <p className="text-gray-500">{fmtRange(data.start_date, data.end_date)}</p>}

        {!data && <div className="mt-6 text-gray-500">No weeks published yet.</div>}

        {data && (
          <div className="rounded-2xl border overflow-hidden mt-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="p-3 text-left">Week</th><th className="p-3 text-left">Dates</th><th className="p-3 text-left">Highlights</th></tr></thead>
              <tbody className="divide-y">
                {data.weeks.map((w: any) => (
                  <tr key={w.week_no} className="hover:bg-gray-50">
                    <td className="p-3"><a className="text-indigo-600 hover:underline" href={`/planner/${year}/${term}/week/${w.week_no}`}>Week {w.week_no}</a></td>
                    <td className="p-3">{fmtRange(w.start_date, w.end_date)}</td>
                    <td className="p-3 text-gray-600">{w.topics.slice(0,2).map((t:any)=>t.module_name ?? t.module_code).join(' • ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}