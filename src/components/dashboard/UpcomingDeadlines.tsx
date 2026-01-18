'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type Assignment = {
  id: string;
  title: string;
  module_name: string | null;
  module_code: string | null;
  due_date: string;
  daysLeft: number;
  status: string;
  current_stage: number;
  nextAction: 'start' | 'continue';
};

export default function UpcomingDeadlines({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  async function fetchUpcoming() {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/overview', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch deadlines');
      }

      const data = await res.json();
      setAssignments(data.upcomingAssignments || []);
    } catch (err: any) {
      console.error('[UpcomingDeadlines] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClickAssignment(id: string) {
    // Navigate DIRECTLY to assignment workflow (not just list view)
    router.push(`/assignments?assignmentId=${id}&view=workflow`);
  }

  function getDaysLeftBadge(daysLeft: number) {
    if (daysLeft < 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
          Overdue
        </span>
      );
    } else if (daysLeft === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
          Due today
        </span>
      );
    } else if (daysLeft <= 3) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
          {daysLeft}d left
        </span>
      );
    } else if (daysLeft <= 7) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
          {daysLeft}d left
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
          {daysLeft}d left
        </span>
      );
    }
  }

  function getStatusChip(status: string) {
    const colors: Record<string, string> = {
      not_started: 'bg-gray-100 text-gray-700',
      planning: 'bg-blue-100 text-blue-700',
      drafting: 'bg-purple-100 text-purple-700',
      editing: 'bg-indigo-100 text-indigo-700',
      submitted: 'bg-green-100 text-green-700',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  }

  if (loading) {
    return (
      <div className={embedded ? "" : "bg-white rounded-xl shadow-sm border border-slate-200 p-6"}>
        {!embedded && <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deadlines</h2>}
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? "" : "bg-white rounded-xl shadow-sm border border-slate-200 p-6"}>
        {!embedded && <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deadlines</h2>}
        <div className="text-center py-8 text-slate-500">
          <p>Failed to load deadlines</p>
          <button 
            onClick={fetchUpcoming}
            className="mt-2 text-blue-600 hover:underline text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={embedded ? "" : "bg-white rounded-xl shadow-sm border border-slate-200 p-6"}>
        {!embedded && <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deadlines</h2>}
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-slate-600 font-medium">No upcoming assignments</p>
          <p className="mt-1 text-sm text-slate-500">Check back later or add a new assignment</p>
          <button
            onClick={() => router.push('/assignments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Go to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "bg-white rounded-xl shadow-sm border border-slate-200 p-6"}>
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h2>
          <button
            onClick={() => router.push('/assignments')}
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </button>
        </div>
      )}

      <div className="space-y-3">
        {assignments.slice(0, 5).map((assignment) => (
          <div
            key={assignment.id}
            className="p-4 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
            onClick={() => handleClickAssignment(assignment.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{assignment.title}</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {assignment.module_name || assignment.module_code || 'No module'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">
                    Due {new Date(assignment.due_date).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  {getDaysLeftBadge(assignment.daysLeft)}
                  {getStatusChip(assignment.status)}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClickAssignment(assignment.id);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                  assignment.nextAction === 'start'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-600 text-white hover:bg-slate-700'
                }`}
              >
                {assignment.nextAction === 'start' ? '▶ Start' : '▶ Continue'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
