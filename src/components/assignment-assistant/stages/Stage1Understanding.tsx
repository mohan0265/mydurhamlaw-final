'use client';

import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, Loader2, ArrowRight, Cloud, CloudOff, Edit3, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface Stage1UnderstandingProps {
  assignmentId: string;
  briefData: any;
  onComplete: (data: any) => void;
  onInsertToDraft?: (payload: any) => void;
}

export default function Stage1Understanding({ 
  assignmentId, 
  briefData, 
  onComplete,
  onInsertToDraft
}: Stage1UnderstandingProps) {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [legalIssues, setLegalIssues] = useState<string[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [writeInDraft, setWriteInDraft] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [userInput]);

  // NEW: Use comprehensive autosave hook
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_1_understanding',
    workflowKey: 'assignment_workflow',
  });

  // REMOVED: Initial Durmah greeting effect. 
  // We now show this as a static "Assignment Briefing" box at the top.

  // AUTO-SAVE: Trigger autosave whenever state changes
  useEffect(() => {
    if (messages.length > 0) {
      saveToAutosave({ messages, quizPassed, quizScore, legalIssues });
    }
  }, [messages, quizPassed, quizScore, legalIssues, saveToAutosave]);

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assignment/durmah-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // FIX: Include cookies for authentication
        body: JSON.stringify({
          assignmentId,
          stage: 1,
          userMessage: userInput,
          context: {
            questionText: briefData?.question_text || '', // CRITICAL: Pass assignment brief
            currentUnderstanding: legalIssues,
            messages: newMessages.slice(-4),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);

      // Check if quiz passed (simple keyword detection - could be enhanced)
      if (data.response.toLowerCase().includes('excellent') || 
          data.response.toLowerCase().includes('well done') ||
          data.response.toLowerCase().includes('you understand')) {
        setQuizPassed(true);
        setQuizScore(100);
      }

    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleComplete = () => {
    // If "Write in Draft" is ON, we assume they did the work in the editor
    if (!quizPassed && !writeInDraft) {
      toast.error('Please complete the understanding quiz first, or switch to "Write in Draft" mode.');
      return;
    }

    onComplete({
      quizScore: writeInDraft ? 100 : quizScore,
      legalIssuesIdentified: legalIssues,
      understandingLevel: writeInDraft ? 'manual' : 'high',
      transcript: messages,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 rounded-lg">
                <Brain className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Stage 1: Understanding</h2>
                <p className="text-sm text-gray-600">Let's make sure you understand the assignment</p>
            </div>
            </div>
            {/* Toggle for Write In Draft */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Write in Draft</span>
                <button 
                    onClick={() => setWriteInDraft(!writeInDraft)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${writeInDraft ? 'bg-violet-600' : 'bg-gray-300'}`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${writeInDraft ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>

        {quizPassed && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm font-semibold text-green-800">
              Great! You understand the assignment. Ready to move on?
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {/* STATIC GUIDE: Initial Instructions (Moved from Chat) */}
        {!quizPassed && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl mb-6">
                <h3 className="font-bold text-violet-800 text-sm mb-2 flex items-center gap-2">
                    <Brain size={16} />
                    Assignment Briefing
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Hi! Let's make sure you fully understand this assignment before we start.
                    I'll explain the key requirements and then quiz you ensuring you're ready to proceed.
                </p>
                {briefData?.question_text && (
                    <div className="bg-white p-3 rounded-lg border border-violet-100 text-sm text-gray-600 italic">
                        "{briefData.question_text.substring(0, 150)}{briefData.question_text.length > 150 ? '...' : ''}"
                    </div>
                )}
                <div className="mt-3 text-xs text-violet-600 font-semibold">
                    Type "Ready" below to start the quiz!
                </div>
            </div>
        )}

        {messages.length === 0 && !quizPassed && (
             <div className="text-center text-gray-400 text-sm py-8">
                 Start the conversation to begin your understanding check.
             </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-4 ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-2">
              <Loader2 className="animate-spin text-violet-600" size={20} />
              <span className="text-sm text-gray-600">Durmah is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        {/* Autosave Status Indicator */}
        <div className="mb-2 flex items-center gap-2 text-xs">
          {saving && (
            <div className="flex items-center gap-1 text-blue-600">
              <Cloud className="animate-pulse" size={14} />
              <span>Saving...</span>
            </div>
          )}
          {saved && !saving && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} />
              <span>Saved</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1 text-orange-600">
              <CloudOff size={14} />
              <span>Saved locally</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 relative">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none min-h-[50px] max-h-[200px] overflow-y-auto pr-24"
            rows={1}
            disabled={loading}
          />
          
          {/* Insert Button overlay inside textarea area if text exists */}
          {userInput.trim().length > 0 && onInsertToDraft && (
             <button
               onClick={() => {
                   onInsertToDraft({
                       source: 'stage',
                       text: userInput,
                       mode: 'cursor',
                       addPrefix: false // User's own text
                   });
                   // Optional: Clear input? No, maybe they want to edit it further or send it to Durmah too.
               }}
               className="absolute right-24 bottom-3 p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
               title="Insert into Draft"
             >
                 <ArrowUpRight size={18} />
             </button>
          )}

          <button
            onClick={sendMessage}
            disabled={loading || !userInput.trim()}
            className="px-6 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition font-semibold self-end"
          >
            Send
          </button>
        </div>

        {/* Action Buttons - Always show Skip option */}
        <div className="mt-4 space-y-2">
          {(quizPassed || writeInDraft) && (
            <button
              onClick={handleComplete}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <span>{writeInDraft ? 'Complete Stage' : 'Continue to Research'}</span>
              <ArrowRight size={20} />
            </button>
          )}
          
          {/* Manual Skip Button - Always Available */}
          {!quizPassed && !writeInDraft && messages.length > 2 && (
            <button
              onClick={() => {
                toast.success('Skipping to Research');
                onComplete({
                  quizScore: 0,
                  legalIssuesIdentified: legalIssues,
                  understandingLevel: 'skipped',
                  transcript: messages,
                });
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <span>Skip to Research →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
