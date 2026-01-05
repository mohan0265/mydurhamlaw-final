'use client';

import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, Loader2, ArrowRight, Cloud, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface Stage1UnderstandingProps {
  assignmentId: string;
  briefData: any;
  onComplete: (data: any) => void;
}

export default function Stage1Understanding({ 
  assignmentId, 
  briefData, 
  onComplete 
}: Stage1UnderstandingProps) {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [legalIssues, setLegalIssues] = useState<string[]>([]);

  // NEW: Use comprehensive autosave hook
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_1_understanding',
    workflowKey: 'assignment_workflow',
  });

  useEffect(() => {
    // Initial Durmah greeting
    const initialMessage = {
      role: 'assistant',
      content: `Hi! Let's make sure you fully understand this assignment before we start working on it. I'll explain it to you and then quiz you to check your understanding. Ready to begin?`
    };
    setMessages([initialMessage]);
  }, []);

  // AUTO-SAVE: Trigger autosave whenever state changes
  useEffect(() => {
    if (messages.length > 1) {
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
            questionText: briefData?.questionText,
            moduleCode: briefData?.moduleCode,
            messages: newMessages.slice(-6), // Last 3 exchanges for context
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
    if (!quizPassed) {
      toast.error('Please complete the understanding quiz first');
      return;
    }

    onComplete({
      quizScore,
      legalIssuesIdentified: legalIssues,
      understandingLevel: 'high',
      transcript: messages,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-600 rounded-lg">
            <Brain className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Stage 1: Understanding</h2>
            <p className="text-sm text-gray-600">Let's make sure you understand the assignment</p>
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

        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !userInput.trim()}
            className="px-6 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition font-semibold self-end"
          >
            Send
          </button>
        </div>

        {quizPassed && (
          <button
            onClick={handleComplete}
            className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <span>Continue to Research</span>
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
