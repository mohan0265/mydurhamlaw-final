/**
 * Transcript Modal - Post-chat session review
 * Shows full conversation history with actions
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Trash2, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabaseStore, VoiceMessage } from '../../lib/voice/supabaseStore';
import { DurmahLogo } from '../ui/DurmahLogo';

interface TranscriptModalProps {
  sessionId: string | null;
  messages?: VoiceMessage[]; // Accept messages directly from endChat()
  onClose: () => void;
  isOpen: boolean;
}

export function TranscriptModal({ sessionId, messages: providedMessages, onClose, isOpen }: TranscriptModalProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load messages when modal opens
  useEffect(() => {
    if (isOpen) {
      if (providedMessages) {
        // Use messages passed from endChat() (in-memory)
        console.log('DURMAH_TRANSCRIPT_USING_PROVIDED_MESSAGES:', providedMessages.length);
        setMessages(providedMessages);
        setIsLoading(false);
      } else if (sessionId) {
        // Fallback to loading from Supabase
        console.log('DURMAH_TRANSCRIPT_LOADING_FROM_DB:', sessionId);
        loadMessages();
      }
    }
  }, [isOpen, sessionId, providedMessages]);

  const loadMessages = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const fetchedMessages = await supabaseStore.getRecent(sessionId, 200);
      setMessages(fetchedMessages);
      console.log('DURMAH_TRANSCRIPT_LOADED_FROM_DB:', fetchedMessages.length);
    } catch (error) {
      console.error('DURMAH_TRANSCRIPT_LOAD_ERR:', error);
      // If DB fails but we have provided messages, use those
      if (providedMessages) {
        setMessages(providedMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllToClipboard = async () => {
    const transcript = messages
      .map(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString();
        const speaker = msg.role === 'user' ? 'You' : 'Durmah';
        return `[${time}] ${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(transcript);
      // Could add toast notification here
    } catch (error) {
      console.error('DURMAH_COPY_ERR:', error);
    }
  };

  const saveAsPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Durmah Voice Session - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
            .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
            .user { background-color: #eff6ff; border-left: 4px solid #3b82f6; }
            .assistant { background-color: #f3e8ff; border-left: 4px solid #8b5cf6; }
            .timestamp { color: #6b7280; font-size: 0.875rem; margin-bottom: 5px; }
            .speaker { font-weight: bold; margin-bottom: 8px; }
            .content { color: #374151; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Durmah Voice Session Transcript</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>${messages.length} messages</p>
          </div>
          ${messages.map(msg => `
            <div class="message ${msg.role}">
              <div class="timestamp">${new Date(msg.created_at).toLocaleString()}</div>
              <div class="speaker">${msg.role === 'user' ? 'You' : 'Durmah'}:</div>
              <div class="content">${msg.content}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `durmah-transcript-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteSession = async () => {
    if (!sessionId) return;

    setIsDeleting(true);
    try {
      const success = await supabaseStore.deleteSession(sessionId);
      if (success) {
        onClose();
      } else {
        console.error('DURMAH_DELETE_ERR: Failed to delete session');
      }
    } catch (error) {
      console.error('DURMAH_DELETE_ERR:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] bg-white/95 backdrop-blur border shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <DurmahLogo className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Voice Session Transcript</h2>
                <p className="text-sm text-gray-600">
                  {messages.length} messages • Session {sessionId?.substring(0, 8)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center space-x-2">
              <Button
                onClick={copyAllToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </Button>
              <Button
                onClick={saveAsPDF}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Save HTML</span>
              </Button>
            </div>
            <Button
              onClick={deleteSession}
              variant="outline"
              size="sm"
              disabled={isDeleting}
              className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Session'}</span>
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading transcript...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No messages in this session</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-50 border-l-4 border-blue-400 ml-8'
                      : 'bg-purple-50 border-l-4 border-purple-400 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">
                      {message.role === 'user' ? 'You' : 'Durmah'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t text-center text-xs text-gray-500">
            Durmah Voice Session • Generated {new Date().toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
}