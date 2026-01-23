import React from 'react';
import { BookOpen, ExternalLink, Link2 } from 'lucide-react';

interface Source {
  title: string;
  type: string;
  snippet?: string;
  link?: string;
}

interface QuizSourcesPanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
}

export const QuizSourcesPanel: React.FC<QuizSourcesPanelProps> = ({ sources, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-100 bg-white h-full overflow-y-auto animate-in slide-in-from-right duration-300 hidden lg:block">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Provenance Panel</h3>
        <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Grounded</span>
      </div>

      <div className="p-6 space-y-8">
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-8 h-8 text-gray-100 mx-auto mb-4" />
            <p className="text-xs text-gray-400 font-medium">No sources loaded yet.</p>
          </div>
        ) : (
          sources.map((source, i) => (
            <div key={i} className="group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
                   <Link2 className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight truncate">{source.type}</span>
              </div>
              
              <h4 className="text-sm font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors leading-snug">
                {source.title}
              </h4>
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden">
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-4 font-medium italic">
                  "{source.snippet || 'Referenced in generating these reasoning challenges...'}"
                </p>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent h-full pointer-events-none"></div>
              </div>
              
              {source.link && (
                <button className="mt-4 flex items-center gap-2 text-[10px] font-bold text-purple-600 hover:text-purple-700 transition">
                  Open Source <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-auto p-6 bg-purple-50/30 m-4 rounded-3xl border border-purple-50">
         <p className="text-[10px] text-purple-800 font-medium leading-relaxed">
           <strong>Safe Learning</strong>: All questions are generated using RAG (Retrieval Augmented Generation) to ensure legal principles are accurate to Durham\'s interpretation.
         </p>
      </div>
    </div>
  );
};
