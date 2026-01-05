'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, AlertTriangle, ArrowRight, Save, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface Stage4DraftingProps {
  assignmentId: string;
  briefData: any;
  outline: any[];
  onComplete: (data: any) => void;
}

export default function Stage4Drafting({ assignmentId, briefData, outline, onComplete }: Stage4DraftingProps) {
  const [content, setContent] = useState('');
  const [durmahFeedback, setDurmahFeedback] = useState('');
  const [aiUsageLog, setAiUsageLog] = useState<string[]>([]);

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const wordLimit = briefData?.wordLimit || 1500;
  const sections = outline || [];

  // Autosave integration - replaces old localStorage-only autosave
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_4_drafting',
    workflowKey: 'assignment_workflow',
  });

  useEffect(() => {
    const saved = localStorage.getItem(`draft_${assignmentId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setContent(data.content || '');
      setAiUsageLog(data.aiUsageLog || []);
    }
  }, []);

  // Trigger autosave when content or AI usage log changes
  useEffect(() => {
    if (content.trim()) {
      saveToAutosave({ content, wordCount, aiUsageLog });
    }
  }, [content, aiUsageLog, saveToAutosave]);

  // Also keep localStorage as fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`draft_${assignmentId}`, JSON.stringify({
        content,
        wordCount,
        aiUsageLog,
        savedAt: new Date().toISOString()
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, aiUsageLog]);



  const getFeedback = async () => {
    if (!content.trim()) {
      toast.error('Write some content first');
      return;
    }

    try {
      const response = await fetch('/api/assignment/durmah-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // FIX: Include cookies for authentication
        body: JSON.stringify({
          assignmentId,
          stage: 4,
          userMessage: `Please review this section: ${content.slice(-500)}`, // Last 500 chars
          context: {
            questionText: briefData?.questionText,
            wordCount,
            wordLimit,
            currentSection: sections[currentSection]?.title,
          },
        }),
      });

      const data = await response.json();
      setDurmahFeedback(data.response);
      
      const logEntry = `Feedback on ${sections[currentSection]?.title || 'section'} - ${new Date().toLocaleTimeString()}`;
      setAiUsageLog([...aiUsageLog, logEntry]);
      
    } catch (error) {
      toast.error('Failed to get feedback');
    }
  };

  const handleComplete = () => {
    // Soft validation - warn but don't block
    if (wordCount < wordLimit * 0.5) {
      toast('⚠️ Draft is quite short. Consider adding more content before finalizing.', {
        duration: 4000,
        icon: '📝',
      });
    } else if (wordCount > wordLimit * 1.1) {
      toast('⚠️ Draft exceeds word limit. Consider trimming before submission.', {
        duration: 4000,
        icon: '✂️',
      });
    }

    // Always allow progression (students can save partial drafts)
    onComplete({
      currentWordCount: wordCount,
      sectionsCompleted: sections.map(s => s.title),
      aiAssistanceUsed: aiUsageLog,
      draft: content,
    });
  };

  return (
    <div className="h-full grid grid-cols-3 gap-4">
      {/* Left: Writing Area (2 cols) */}
      <div className="col-span-2 bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Edit3 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Stage 4: Drafting</h2>
              <p className="text-sm text-gray-600">
                {wordCount} / {wordLimit} words
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Autosave indicator - More prominent */}
            <div className="px-3 py-1 rounded-full bg-gray-50 flex items-center gap-2 text-sm font-medium">
              {saving && (
                <><Cloud className="animate-pulse text-blue-600" size={16} /><span className="text-blue-600">Saving...</span></>
              )}
              {saved && !saving && (
                <><CheckCircle size={16} className="text-green-600" /><span className="text-green-600">✓ Saved</span></>
              )}
              {saveError && (
                <><CloudOff size={16} className="text-orange-600" /><span className="text-orange-600">⚠ Saved locally</span></>
              )}
            </div>
          </div>
        </div>

        {/* Word Count Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                wordCount > wordLimit * 1.1 ? 'bg-red-500' : 
                wordCount >= wordLimit * 0.9 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{width: `${Math.min((wordCount / wordLimit) * 100, 100)}%`}}
            />
          </div>
        </div>

        {/* Academic Integrity Warning */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Academic Integrity Reminder</p>
            <p className="text-xs mt-1">
              Write your own work. Durmah provides guidance only - not full paragraphs.
              All AI assistance is logged and must be declared.
            </p>
          </div>
        </div>


        {/* Editor - Fixed height so buttons stay visible */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your essay here... Remember to cite sources as you go!"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 resize-none font-serif text-gray-800 leading-relaxed"
          style={{height: '400px'}}
        />

        {/* Action buttons - ALWAYS visible at bottom */}
        <div className="mt-4 flex gap-2">
          <button onClick={getFeedback} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Get Durmah Feedback
          </button>
          <button onClick={handleComplete} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold">
            Continue to Formatting <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Right: Durmah Feedback & AI Usage */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <h3 className="text-lg font-bold mb-4">Durmah Feedback</h3>
        
        {durmahFeedback ? (
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{durmahFeedback}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center">
            Write some content and click "Get Feedback" for Durmah's guidance
          </div>
        )}

        <div className="mt-auto">
          <h4 className="font-semibold text-sm mb-2">AI Assistance Log</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            {aiUsageLog.length > 0 ? (
              <ul className="text-xs space-y-1">
                {aiUsageLog.map((log, idx) => (
                  <li key={idx} className="text-gray-600">• {log}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No AI assistance used yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
