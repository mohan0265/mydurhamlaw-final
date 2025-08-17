import { addDaysISO } from '@/lib/date/format';
import { buildAssignmentLink, buildExamLink, buildTimetableLink } from '@/lib/planner/links';

type Topic = {
  day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri';
  title: string;
  module_code: string;
  module_name?: string;
  ref_slug?: string;
  order_idx?: number;
};

export default function WeekDetails({
  weekNo, startISO, endISO, topics
}: { weekNo: number; startISO: string; endISO: string; topics: Topic[] }) {

  const days: Array<Topic & { dateISO: string }>[] = ['Mon','Tue','Wed','Thu','Fri'].map((day, i) => {
    const dateISO = addDaysISO(startISO, i);
    const dayTopics = topics.filter(t => t.day === day).map(t => ({ ...t, dateISO }));
    return dayTopics;
  });

  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Day</th>
            <th className="text-left p-3">Topic</th>
            <th className="text-left p-3">Module</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {['Mon','Tue','Wed','Thu','Fri'].map((label, idx) => {
            const items = days[idx];
            if (!items || items.length === 0) {
              return (
                <tr key={label}>
                  <td className="p-3 font-medium">{label}</td>
                  <td className="p-3 text-gray-400" colSpan={3}>—</td>
                </tr>
              );
            }
            return items.map((it, i) => (
              <tr key={`${label}-${i}`}>
                <td className="p-3 font-medium">{label}</td>
                <td className="p-3">{it.title}</td>
                <td className="p-3 text-gray-600">{it.module_name ?? it.module_code}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <a className="px-2 py-1 rounded border text-xs hover:bg-gray-50" href={buildTimetableLink(it.dateISO)}>Timetable</a>
                    <a className="px-2 py-1 rounded border text-xs hover:bg-gray-50" href={buildAssignmentLink(it.module_code, weekNo)}>Assignments</a>
                    <a className="px-2 py-1 rounded border text-xs hover:bg-gray-50" href={buildExamLink(it.module_code, it.ref_slug)}>Exam Prep</a>
                  </div>
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}