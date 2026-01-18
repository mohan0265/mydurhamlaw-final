import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'; // Assuming these exist from StudyFocusWidget
import { Plus, CheckCircle, Circle, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'open' | 'completed';
}

const TodaysTasksWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const tempId = 'temp-' + Date.now();
    const optimisticTask: Task = { id: tempId, title: newTask, status: 'open' };
    setTasks([optimisticTask, ...tasks]);
    setNewTask('');
    setIsAdding(false);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: optimisticTask.title })
      });
      if (res.ok) {
        const savedTask = await res.json();
        setTasks(current => current.map(t => t.id === tempId ? savedTask : t));
      }
    } catch (e) {
      console.error('Add task failed', e);
      fetchTasks(); // Revert
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'open' ? 'completed' : 'open';
    setTasks(current => current.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error('Toggle task failed', e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Today&apos;s Tasks</h2>
        <button 
           onClick={() => setIsAdding(!isAdding)}
           className="p-1 rounded-md hover:bg-gray-100 text-purple-600"
        >
           <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto max-h-[300px]">
        {isAdding && (
          <form onSubmit={addTask} className="mb-4">
            <input
              autoFocus
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs doing?"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </form>
        )}

        {loading ? (
           <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : tasks.length === 0 ? (
           <div className="text-center py-6 text-gray-400 text-sm">
              No tasks yet. Click + to add one.
           </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map(task => (
              <li key={task.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleTask(task)}>
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${task.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' : 'border-gray-300 text-transparent hover:border-purple-400'}`}>
                   <CheckCircle className={`w-3.5 h-3.5 ${task.status === 'completed' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className={`text-sm transition-all ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
       <div className="p-3 border-t bg-gray-50 rounded-b-xl text-center">
         <a href="/tasks" className="text-xs font-medium text-purple-600 hover:underline">View all tasks</a>
       </div>
    </div>
  );
};

export default TodaysTasksWidget;
