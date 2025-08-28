import Link from 'next/link';
import { NotAvailableBadge } from './Badges';

export default function EmptyState({ year }: { year: number }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center text-gray-600">
      <div className="flex justify-center mb-2"><NotAvailableBadge /></div>
      <p className="mb-2">Authoritative syllabus data for Year {year} is not available yet.</p>
      <p className="text-sm text-gray-500">We never display fabricated content. If you have the official schedule, you can add it below for your own planning while we verify.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href={`/planner/${year}/contribute`} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">
          Add my details
        </Link>
        <Link href="/contact" className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">
          Notify support
        </Link>
      </div>
    </div>
  );
}