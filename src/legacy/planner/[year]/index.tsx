import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getYear } from '@/lib/syllabus/fetch';
import EmptyState from '@/components/planner/EmptyState';
import { fmtRange } from '@/lib/date/format';

export default function YearPage() {
  const [year, setYear] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading'|'ok'|'empty'|'err'>('loading');

  useEffect(() => {
    const y = Number(window.location.pathname.split('/').filter(Boolean)[1]);
    setYear(y);
    getYear(y).then(res => {
      if (!res.available) { setState(res.reason === 'no-data' ? 'empty' : 'err'); return; }
      setData(res.year); setState('ok');
    });
  }, []);

  return (
    <>
      <Head><title>{year ? `Year ${year} · My Year at a Glance` : 'My Year at a Glance'}</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">My Year at a Glance</h1>

        {state === 'loading' && <div className="mt-6 text-gray-500">Loading…</div>}
        {state === 'empty' && year && <div className="mt-6"><EmptyState year={year} /></div>}
        {state === 'err' && <div className="mt-6 text-red-600">Unable to load right now.</div>}

        {state === 'ok' && data && (
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {data.terms.map((t: any) => (
              <Link key={t.slug} href={`/planner/${data.year_number}/${t.slug}`}
                className="rounded-2xl border p-4 hover:shadow transition">
                <div className="text-xs text-gray-500">TERM</div>
                <div className="text-lg font-semibold">{t.name}</div>
                <div className="text-gray-500">{fmtRange(t.start_date, t.end_date)}</div>
                <div className="mt-2 text-sm text-gray-600">Weeks: {t.weeks.length}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}