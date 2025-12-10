import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Assignment } from '@/types/assignments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BookOpen, Clock, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function UpcomingAssignmentsWidget({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .neq('status', 'submitted')
        .order('due_date', { ascending: true })
        .limit(3);
      
      if (data) setAssignments(data as Assignment[]);
      setLoading(false);
    };
    fetchAssignments();
  }, [userId]);

  if (loading) return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;

  return (
    <Card hover className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
             <BookOpen className="text-violet-600" size={20} />
             Upcoming Assignments
          </CardTitle>
          <Link 
            href="/assignments?new=true" 
            className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-violet-100 transition-colors"
          >
             <Plus size={12} /> New
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length > 0 ? (
          <div className="space-y-3">
             {assignments.map(a => (
               <Link 
                 key={a.id} 
                 href={`/assignments?assignmentId=${a.id}`}
                 className="block p-3 rounded-lg border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all group"
               >
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 rounded-sm">
                       {a.assignment_type || 'Task'}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-violet-600 flex items-center gap-1">
                       <Clock size={10} /> {format(new Date(a.due_date), 'MMM d')}
                    </span>
                 </div>
                 <h4 className="text-sm font-bold text-gray-800 line-clamp-1 mb-0.5">{a.title}</h4>
                 <div className="text-xs text-gray-500 truncate">
                    {a.module_code} {a.module_name}
                 </div>
               </Link>
             ))}
             <Link href="/assignments" className="block text-center text-xs text-gray-400 hover:text-violet-600 mt-2">
                View all assignments →
             </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
             <div className="bg-gray-100 p-2 rounded-full mb-2">
                <BookOpen size={16} />
             </div>
             <p className="text-sm">No active assignments.</p>
             <p className="text-xs mt-1">Great job keeping up!</p>
             <Link href="/assignments?new=true" className="mt-3 text-xs text-violet-600 font-medium hover:underline">
               + Add one manually
             </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
