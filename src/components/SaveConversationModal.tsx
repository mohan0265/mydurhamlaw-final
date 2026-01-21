import React from 'react';
import { X, Save, CheckSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SaveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageCount: number;
  onSaveAll: () => void;
  onSelectMessages: () => void;
  onDiscard: () => void;
}

export default function SaveConversationModal({
  isOpen,
  onClose,
  messageCount,
  onSaveAll,
  onSelectMessages,
  onDiscard
}: SaveConversationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Save this conversation?</h3>
              <p className="text-sm text-gray-500 mt-1">
                {messageCount} message{messageCount !== 1 ? 's' : ''} in this session
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-6 space-y-3">
            {/* Save All */}
            <button
              onClick={onSaveAll}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center">
                <Save size={20} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-violet-900 group-hover:text-violet-950">Save All Messages</div>
                <div className="text-xs text-violet-700">Keep the entire conversation for future reference</div>
              </div>
            </button>

            {/* Select Messages */}
            <button
              onClick={onSelectMessages}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center">
                <CheckSquare size={20} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900 group-hover:text-gray-950">Select Messages</div>
                <div className="text-xs text-gray-600">Choose specific messages to save</div>
              </div>
            </button>

            {/* Discard */}
            <button
              onClick={onDiscard}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-red-900 group-hover:text-red-950">Discard</div>
                <div className="text-xs text-red-700">Delete all messages from this session</div>
              </div>
            </button>
          </div>

          {/* Footer Help Text */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Note:</span> Saved messages can be accessed later via Durmah's conversation memory.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
