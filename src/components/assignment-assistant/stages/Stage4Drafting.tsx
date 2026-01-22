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
  // We no longer manage content here - it is in the persistent editor in the middle column
  
  const handleComplete = () => {
    // Just complete the stage
    onComplete({
      completedAt: new Date().toISOString()
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
       <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-orange-600 rounded-lg text-white">
                <Edit3 size={20} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800">Drafting Phase</h3>
                <p className="text-xs text-gray-600">Write your essay in the editor panel (center).</p>
             </div>
          </div>
          <p className="text-sm text-gray-700">
             Focus on getting your arguments down. Use the formatting tools in the editor toolbar.
             Durmah (right) can help you refine your arguments.
          </p>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
           {/* Guidelines */}
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs">1</span>
                  Structure (IRAC)
              </h4>
              <p className="text-sm text-gray-600 mb-2">Ensure each paragraph follows IRAC:</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                  <li><strong>Issue:</strong> State the legal issue.</li>
                  <li><strong>Rule:</strong> Cite the relevant case or statute.</li>
                  <li><strong>Analysis:</strong> Apply the rule to the facts.</li>
                  <li><strong>Conclusion:</strong> Conclude on the issue.</li>
              </ul>
           </div>

           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs">2</span>
                  Formatting Tips
              </h4>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                  <li>Use <strong>Times New Roman, 12pt</strong> (Default).</li>
                  <li>Double spacing is enforced automatically.</li>
                  <li>Use <strong>Bold</strong> for headings only.</li>
              </ul>
           </div>
       </div>

       <div className="pt-4 border-t border-gray-200">
          <button 
            onClick={handleComplete}
            className="w-full py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-medium flex items-center justify-center gap-2 shadow-sm"
          >
             <span>Check Draft & Proceed to Formatting</span>
             <ArrowRight size={18} />
          </button>
       </div>
    </div>
  );
}
