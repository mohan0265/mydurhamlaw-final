import React, { useState, useEffect } from 'react';
import { Book, Plus, Send, Loader2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
}

const MemoryJournalWidget = () => {
  const [lastEntry, setLastEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = async () => {
    try {
      const res = await fetch('/api/journal?limit=1');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLastEntry(data[0]);
        }
      }
    } catch (e) {
      console.error('Fetch journal failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newEntry.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newEntry })
      });
      if (res.ok) {
        const saved = await res.json();
        setLastEntry(saved);
        setNewEntry('');
        setIsWriting(false);
      }
    } catch (e) {
      console.error('Save journal failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
       <div className="p-5 border-b border-gray-100 flex items-center gap-2">
         <Book className="w-5 h-5 text-indigo-600" />
         <h2 className="text-lg font-bold text-gray-900">Memory Journal</h2>
       </div>

       <div className="p-5 flex-1">
         {isWriting ? (
           <div className="h-full flex flex-col">
             <textarea 
               value={newEntry}
               onChange={(e) => setNewEntry(e.target.value)}
               className="w-full flex-1 p-3 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
               placeholder="What one thing did you learn today?"
               autoFocus
             />
             <div className="flex justify-end gap-2">
               <button 
                 onClick={() => setIsWriting(false)}
                 className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSave}
                 disabled={submitting || !newEntry.trim()}
                 className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
               >
                 {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                 Save
               </button>
             </div>
           </div>
         ) : (
           <div className="h-full flex flex-col justify-between">
             {loading ? (
                <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
             ) : lastEntry ? (
               <div className="mb-4">
                 <p className="text-xs text-gray-500 mb-1">
                   {new Date(lastEntry.created_at).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                 </p>
                 <p className="text-sm text-gray-700 italic border-l-2 border-indigo-200 pl-3 line-clamp-3">
                   &quot;{lastEntry.content}&quot;
                 </p>
               </div>
             ) : (
               <p className="text-sm text-gray-500 text-center py-4">
                 No entries yet. Capture a thought!
               </p>
             )}
             
             <button 
               onClick={() => setIsWriting(true)}
               className="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" /> Add Entry
             </button>
           </div>
         )}
       </div>
    </div>
  );
};

export default MemoryJournalWidget;
