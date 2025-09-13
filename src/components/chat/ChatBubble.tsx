'use client'

import React from 'react';
import { User, Bot } from 'lucide-react';

interface ChatBubbleProps {
  message?: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  };
  role?: 'user' | 'assistant';
  content?: string;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, role, content, className = '' }) => {
  const messageRole = message?.role || role || 'user';
  const messageContent = message?.content || content || '';
  const messageTimestamp = message?.timestamp;
  const isUser = messageRole === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-1 ${className}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 sm:p-4 ${
          isUser
            ? 'bg-purple-600 text-white dark:bg-purple-500'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        <div className="flex items-start space-x-2">
          {!isUser && <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />}
          {isUser && <User className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-0.5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base leading-relaxed break-words">
              {!isUser && <strong className="text-purple-800 dark:text-purple-300">Durmah: </strong>}
              {messageContent}
            </p>
            {messageTimestamp && (
              <span className={`text-xs block mt-2 ${
                isUser ? 'text-purple-200 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {messageTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};