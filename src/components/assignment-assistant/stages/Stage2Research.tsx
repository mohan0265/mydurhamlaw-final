'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResearchNote {
  id: string;
  source_type: string;
  citation: string;
  notes: string;
}

interface Stage2ResearchProps {
  assignmentId: string;
  briefData: any;
  onComplete: (data: any) => void;
}

export default function Stage2Research({ assignmentId, briefData, onComplete }: Stage2ResearchProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNote, setNewNote] = useState({ source_type: 'case', citation: '', notes: '' });
  const [durmahMessages, setDurmahMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const minSources = 5;
  const researchComplete = notes.length >= minSources;

  useEffect(() => {
    loadNotes();
    const initial = {
      role: 'assistant',
      content: "Let's find the legal sources you'll need. I'll suggest key cases and statutes, but you need to read them and take notes. What legal area is this assignment about?"
    };
    setDurmahMessages([initial]);
  }, []);

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

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const newMessages = [...durmahMessages, { role: 'user', content: userInput }];
    setDurmahMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assignment/durmah-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          stage: 2,
          userMessage: userInput,
          context: {
            questionText: briefData?.questionText,
            currentResearch: notes.map(n => n.citation),
            messages: newMessages.slice(-4),
          },
        }),
      });

      const data = await response.json();
      setDurmahMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      toast.error('Failed to get guidance');
    } finally {
      setLoading(false);
    }
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
      researchCompletePercent: 100,
      notes,
    });
  };

  return (
    <div className="h-full grid grid-cols-2 gap-4">
      {/* Left: Research Notes */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpen className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Stage 2: Research</h2>
            <p className="text-sm text-gray-600">
              {notes.length}/{minSources} sources minimum
            </p>
          </div>
        </div>

        {researchComplete && (
          <div className="mb-4 p-3 bg-green-100 rounded-lg flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm font-semibold text-green-800">Research complete!</span>
          </div>
        )}

        {/* Add Note Form */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
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
          <button onClick={addNote} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
            <Plus size={20} />
            Add Source
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {notes.map(note => (
            <div key={note.id} className="p-3 bg-white border rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <span className= "text-xs font-semibold text-blue-600 uppercase">{note.source_type}</span>
                <button onClick={() => deleteNote(note.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-semibold mb-1">{note.citation}</p>
              <p className="text-xs text-gray-600">{note.notes}</p>
            </div>
          ))}
        </div>

        {researchComplete && (
          <button onClick={handleComplete} className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            Continue to Structure <ArrowRight size={20} />
          </button>
        )}
      </div>

      {/* Right: Durmah Guidance */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <h3 className="text-lg font-bold mb-4">Durmah's Research Guidance</h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {durmahMessages.map((msg, idx) => (
            <div key={idx} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-violet-100 ml-8' : 'bg-gray-100 mr-8'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask for research guidance..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button onClick={sendMessage} disabled={loading} className="px-4 py-2 bg-violet-600 text-white rounded-lg">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
