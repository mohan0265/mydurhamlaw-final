
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { telemetry } from '@/lib/telemetry';
import { resilientFetch } from '@/lib/resilient-fetch';
import { MessageCircle, Send, ExternalLink, AlertTriangle, X, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Source {
  title: string;
  type: 'case' | 'statute' | 'book' | 'article' | 'website';
  citation?: string;
  url?: string;
}

interface ChatResponse {
  answer: string;
  sources: Source[];
  mode: string;
  module: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string;
  initialModule?: string;
}

export default function DurmahChatPanel({ 
  isOpen, 
  onClose, 
  initialMode = 'default',
  initialModule = 'general' 
}: Props) {
  const isEnabled = useFeatureFlag('ff_ai_chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Track chat request
      telemetry.chatRequest(initialMode, initialModule);

      const response = await resilientFetch('/netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user', // TODO: Get from auth context
        },
        body: JSON.stringify({
          messages: messages.concat([userMessage]).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          mode: initialMode,
          module: initialModule,
        }),
        endpoint: 'chat',
        showErrorToast: false,
      });

      const data: ChatResponse = await response.json();

      if (data.answer) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setSources(data.sources || []);
        
        if (data.sources && data.sources.length > 0) {
          setShowSources(true);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEnabled) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Durmah AI Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Minimize2 className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Academic Integrity Banner */}
            <div className="p-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong>Academic Integrity:</strong> This AI assistant provides study guidance and explanations. 
                  Always cite sources and ensure your work reflects your own understanding.
                </div>
              </div>
            </div>

            <div className="flex h-[500px]">
              {/* Chat Area */}
              <div className={`flex flex-col transition-all duration-300 ${
                showSources ? 'w-2/3' : 'w-full'
              }`}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Ask me about legal concepts, cases, or study guidance!</p>
                      <p className="text-xs mt-1">
                        Try: "Explain the neighbor principle in Donoghue v Stevenson"
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-xs mt-1 opacity-70 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about legal concepts..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Sources Sidebar */}
              {showSources && (
                <div className="w-1/3 border-l border-gray-200 bg-gray-50">
                  <div className="p-3 border-b border-gray-200 bg-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-900">Sources & References</h4>
                      <button
                        onClick={() => setShowSources(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 overflow-y-auto h-[400px]">
                    {sources.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No sources found for this response.
                      </p>
                    ) : (
                      sources.map((source, index) => (
                        <div key={index} className="bg-white rounded p-2 border border-gray-200">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-xs text-gray-900 mb-1">
                                {source.title}
                              </h5>
                              {source.citation && (
                                <p className="text-xs text-gray-600 mb-1">
                                  {source.citation}
                                </p>
                              )}
                              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {source.type}
                              </span>
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {sources.length > 0 && (
                      <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 rounded">
                        <strong>Always verify sources independently.</strong> Use these as starting points for your research.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
