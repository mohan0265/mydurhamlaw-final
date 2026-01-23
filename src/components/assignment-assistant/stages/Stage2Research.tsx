/* eslint-disable @next/next/no-async-client-component */
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle, ArrowRight, Cloud, CloudOff, PenLine, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface ResearchNote {
  id: string;
  source_type: string;
  citation: string;
  notes: string;
}

// Props interface - functions are valid in 'use client' components
interface Stage2ResearchProps {
  assignmentId: string;
  briefData: any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onComplete: (data: any) => void;
  onInsertToDraft?: (content: string, type: 'text' | 'html', addPrefix?: boolean) => void;
}

export default function Stage2Research({ assignmentId, briefData, onComplete, onInsertToDraft }: Stage2ResearchProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNote, setNewNote] = useState({ source_type: 'case', citation: '', notes: '' });
  
  const minSources = 5;
  const researchComplete = notes.length >= minSources;

  // Autosave integration
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_2_research',
    workflowKey: 'assignment_workflow',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  // Trigger autosave when data changes
  useEffect(() => {
    if (notes.length > 0) {
      saveToAutosave({ notes, researchComplete });
    }
  }, [notes, saveToAutosave, researchComplete]);

  const loadNotes = async () => {
    // Load from Supabase in real implementation
    const saved = localStorage.getItem(`research_${assignmentId}`);
    if (saved) setNotes(JSON.parse(saved));
  };

  const addNote = () => {
    if (!newNote.citation || !newNote.notes) {
      toast.error('Please fill citation and notes');
      return;
    }

    const note: ResearchNote = {
      id: Date.now().toString(),
      ...newNote
    };

    const updated = [...notes, note];
    setNotes(updated);
    localStorage.setItem(`research_${assignmentId}`, JSON.stringify(updated));
    setNewNote({ source_type: 'case', citation: '', notes: '' });
    toast.success('Research note added');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem(`research_${assignmentId}`, JSON.stringify(updated));
  };

  const handleComplete = () => {
    if (!researchComplete) {
      toast.error(`Add at least ${minSources} sources before continuing`);
      return;
    }

    onComplete({
      casesFound: notes.filter(n => n.source_type === 'case').map(n => n.citation),
      statutesFound: notes.filter(n => n.source_type === 'statute').map(n => n.citation),
      secondarySources: notes.filter(n => n.source_type === 'article' || n.source_type === 'book').map(n => n.citation),
      sourceCount: notes.length,
      researchCompletePercent: 100,
      notes,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2">
       {/* Guidance Tip Block */}
       <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 mt-1">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">Research Tips</h3>
            <p className="text-sm text-indigo-700 mt-1">
              Start by identifying the legal area. Find <strong>key cases</strong> and <strong>statutes</strong>. 
              Read them and summarize the key principles in your own words below.
              Aim for at least 5 credible sources.
            </p>
          </div>
        </div>
      </div>

      {/* Research Entry Tool */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Stage 2: Research</h2>
              <p className="text-sm text-gray-600">{notes.length}/5 sources minimum</p>
            </div>
          </div>
          {/* Autosave indicator */}
          <div className="text-xs flex items-center gap-1">
            {saving && (
              <><Cloud className="animate-pulse text-blue-600" size={14} /><span className="text-blue-600">Saving...</span></>
            )}
            {saved && !saving && (
              <><CheckCircle size={14} className="text-green-600" /><span className="text-green-600">Saved</span></>
            )}
            {saveError && (
              <><CloudOff size={14} className="text-orange-600" /><span className="text-orange-600">Saved locally</span></>
            )}
          </div>
        </div>

        {/* Research complete + Continue button */}
        {researchComplete && (
          <div className="mb-4">
            <div className="mb-3 p-3 bg-green-100 rounded-lg flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-semibold text-green-800">Research complete! ✅</span>
            </div>
            <button onClick={handleComplete} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold shadow-md">
              Continue to Structure <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Add Source Form */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2 border-2 border-blue-100">
          <select
            value={newNote.source_type}
            onChange={(e) => setNewNote({...newNote, source_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="case">Case</option>
            <option value="statute">Statute</option>
            <option value="article">Article</option>
            <option value="book">Book</option>
          </select>
          <input
            type="text"
            placeholder="OSCOLA Citation (e.g., Smith v Jones [2020] UKSC 1)"
            value={newNote.citation}
            onChange={(e) => setNewNote({...newNote, citation: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Your notes on this source..."
            value={newNote.notes}
            onChange={(e) => setNewNote({...newNote, notes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
          <button onClick={addNote} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
            <Plus size={20} />
            Add Source
          </button>
        </div>


        {/* Sources List */}
        <div className="border-t-2 border-gray-200 pt-3 flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Added Sources ({notes.length}):</h3>
          <div className="overflow-y-auto space-y-2 pr-2 pb-2">
            {notes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No sources added yet. Add your first source above!</p>
            )}
            {notes.map(note => (
              <div key={note.id} className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition group">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-600 uppercase px-2 py-1 bg-blue-50 rounded">{note.source_type}</span>
                  <button onClick={() => deleteNote(note.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm font-semibold mb-1">{note.citation}</p>
                <div className="p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-100">
                  {note.notes}
                </div>
                {/* Insert to Draft Button */}
                 {onInsertToDraft && (
                    <div className="flex justify-end mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          const content = `<strong>${note.citation}</strong>: ${note.notes}`;
                          onInsertToDraft(content, 'html', true); // Use HTML to preserve bold citation
                          toast.success('Added to draft');
                        }}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
                      >
                         <PenLine size={12} /> Insert Note to Draft
                      </button>
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
