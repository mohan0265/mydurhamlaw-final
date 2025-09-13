
'use client'

import React from 'react';
import { Loader } from 'lucide-react';

interface ChatLoadingProps {
  message?: string;
  className?: string;
}

export const ChatLoading: React.FC<ChatLoadingProps> = ({ 
  message = "Thinking...", 
  className = '' 
}) => {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[70%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Loader className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">{message}</span>
        </div>
      </div>
    </div>
  );
};
