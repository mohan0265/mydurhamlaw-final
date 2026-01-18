import React, { useState } from 'react';
import { Brain, Save, Copy, CheckCircle, AlertTriangle, BookOpen, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

interface NewsAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    title: string;
    url?: string;
    source?: string;
    summary?: string;
  };
  initialAnalysis?: any; // If provided, shows result immediately
  readOnly?: boolean; // If true, hides save button or shows 'Archived' status
  originalText?: string;
}

export const NewsAnalysisModal: React.FC<NewsAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  article, 
  initialAnalysis, 
  readOnly = false,
  originalText 
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'input' | 'processing' | 'result'>(initialAnalysis ? 'result' : 'input');
  const [fullText, setFullText] = useState(originalText || '');
  const [analysis, setAnalysis] = useState<any>(initialAnalysis || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset state when opening/closing or changing article, if not in readOnly mode
  // logic handled by mounting/unmounting usually, but if kept mounted:
  // (Simplified for now)

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!fullText.trim()) return;
    setStep('processing');

    try {
      const res = await fetch('/api/durmah/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_text: fullText,
          metadata: { title: article.title, source: article.source }
        })
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setAnalysis(data.analysis);
      setStep('result');
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Please try again.');
      setStep('input');
    }
  };

  const handleSave = async () => {
    if (!user || !analysis || readOnly) return;
    setIsSaving(true);
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { error } = await supabase
        .from('news_analyses')
        .insert({
          user_id: user.id,
          article_title: article.title,
          article_url: article.url,
          article_source: article.source,
          original_text: fullText,
          ai_analysis: analysis
        });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to save analysis.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Brain className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">AI Legal Analysis</h2>
               <p className="text-sm text-gray-500 truncate max-w-md">{article.title}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          
          {step === 'input' && (
            <div className="space-y-6">
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Step 1: Paste Article Text</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Since this is a live news summary, please click the "Original Article" link to copy the full text, then paste it below for deep analysis.
                    </p>
                    {article.url && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm mt-2 inline-block font-medium hover:text-blue-800">
                        Open original article at {article.source} ↗
                        </a>
                    )}
                  </div>
               </div>

               <textarea
                 className="w-full h-64 p-4 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-mono text-sm resize-none"
                 placeholder="Paste the full article text here..."
                 value={fullText}
                 onChange={(e) => setFullText(e.target.value)}
                 disabled={readOnly}
               />

               {!readOnly && (
                   <div className="flex justify-end">
                     <Button 
                       onClick={handleAnalyze} 
                       disabled={!fullText.trim()}
                       className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-purple-200"
                     >
                       <Brain className="w-5 h-5" />
                       Analyze Text
                     </Button>
                   </div>
               )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-gray-900">Durmah is analyzing...</h3>
              <p className="text-gray-500 mt-2">Extracting legal concepts, essay angles, and summary.</p>
            </div>
          )}

          {step === 'result' && analysis && (
            <div className="space-y-8">
              
              {/* Summary */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" /> Executive Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Modules */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <Brain className="w-5 h-5 text-blue-600" /> Module Relevance
                   </h3>
                   <ul className="space-y-3">
                     {analysis.module_relevance?.map((m: any, i: number) => (
                       <li key={i} className="bg-blue-50 p-3 rounded-lg">
                         <span className="font-bold text-blue-800 block text-sm">{m.module}</span>
                         <span className="text-blue-700 text-sm">{m.relevance}</span>
                       </li>
                     ))}
                   </ul>
                </div>

                {/* Essay Angles */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <CheckCircle className="w-5 h-5 text-green-600" /> Essay Angles
                   </h3>
                   <ul className="list-disc list-inside space-y-2 text-gray-700">
                     {analysis.essay_angles?.map((angle: string, i: number) => (
                       <li key={i} className="text-sm leading-relaxed marker:text-green-500">{angle}</li>
                     ))}
                   </ul>
                </div>
              </div>

               {/* Discussion */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" /> Discussion Points
                </h3>
                 <ul className="grid sm:grid-cols-2 gap-4">
                     {analysis.discussion_questions?.map((q: string, i: number) => (
                       <li key={i} className="bg-orange-50 p-3 rounded-lg text-orange-800 text-sm font-medium border border-orange-100">
                         {q}
                       </li>
                     ))}
                 </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                {!readOnly && <Button variant="ghost" onClick={() => setStep('input')}>Back to Edit</Button>}
                
                {readOnly ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        Archived in Library
                    </div>
                ) : (
                    <Button 
                    onClick={handleSave} 
                    disabled={isSaving || saved}
                    className={`px-6 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-md transition-all ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved to Library' : 'Save Analysis'}
                    </Button>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
