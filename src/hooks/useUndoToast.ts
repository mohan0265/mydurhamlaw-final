'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  id: string;
}

const UndoToast = ({ message, onUndo, id }: UndoToastProps) => (
  <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
    </div>
    <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-800 pl-3">
      <button
        onClick={() => {
          onUndo();
          toast.dismiss(id);
        }}
        className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
      >
        <RotateCcw size={14} />
        UNDO
      </button>
      <button
        onClick={() => toast.dismiss(id)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X size={14} />
      </button>
    </div>
  </div>
);

/**
 * Hook to trigger a toast with an undo action.
 * Ideal for "Soft Deletes" or revertible state changes.
 */
export function useUndoToast() {
  const showUndoToast = (onUndo: () => void, message = "Removed. Undo?", duration = 5000) => {
    toast.custom(
      (t) => <UndoToast message={message} onUndo={onUndo} id={t.id} />,
      { duration }
    );
  };

  return { showUndoToast };
}
