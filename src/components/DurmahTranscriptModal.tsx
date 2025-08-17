import React from 'react';
import { useDurmah } from '@/context/DurmahContext';
import { motion, AnimatePresence } from 'framer-motion';

const DurmahTranscriptModal: React.FC = () => {
  const { transcriptOpen, closeTranscript, displayMessages, saveTranscript, deleteTranscript } = useDurmah();

  return (
    <AnimatePresence>
      {transcriptOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={closeTranscript}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-slate-800 text-white rounded-2xl shadow-xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">Conversation Transcript</h2>
              <p className="text-slate-400">Review your voice session.</p>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              {displayMessages.map((msg) => (
                <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <p className="font-semibold capitalize">{msg.role}</p>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button onClick={deleteTranscript} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={saveTranscript} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Save</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DurmahTranscriptModal;