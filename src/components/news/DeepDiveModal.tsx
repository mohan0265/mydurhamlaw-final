import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { X, FileText, Brain } from 'lucide-react';

interface DeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: { title: string; source: string; url: string } | null;
  onSubmit: (notes: string) => void;
}

export function DeepDiveModal({ isOpen, onClose, article, onSubmit }: DeepDiveModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !article) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setIsSubmitting(true);
    // Simulate short delay for UX
    setTimeout(() => {
        onSubmit(notes);
        setIsSubmitting(false);
        setNotes('');
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Deep Dive Analysis</h2>
              <p className="text-sm text-gray-500 line-clamp-1">{article.title}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                    Paste key excerpts or your own notes to help Durmah analyze this specific content. 
                    <span className="block mt-1 text-xs opacity-75">
                        Tip: Don't paste full copyrighted articles. Use 2-3 key paragraphs.
                    </span>
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Notes / Excerpts
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste text here..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                    autoFocus
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={!notes.trim() || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isSubmitting ? 'Analyzing...' : 'Start AI Analysis'}
                </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
