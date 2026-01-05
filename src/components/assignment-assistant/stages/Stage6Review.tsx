'use client';

import React, { useState } from 'react';
import { CheckCircle, Download, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Stage6ReviewProps {
  assignmentId: string;
  briefData: any;
  aiUsageLog: string[];
  finalDraft: string;
  onComplete: () => void;
}

export default function Stage6Review({ assignmentId, briefData, aiUsageLog, finalDraft, onComplete }: Stage6ReviewProps) {
  const [checklist, setChecklist] = useState({
    wordCount: false,
    citations: false,
    plagiarismAware: false,
    aiDeclaration: false,
    formatting: false,
    deadline: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist({...checklist, [key]: !checklist[key]});
  };

  const generateAIDeclaration = () => {
    const declaration = `
[Note: In accordance with Durham Law School's Generative AI Policy (2025-26), the following AI assistance was used in preparing this assignment:

${aiUsageLog.map((log, idx) => `${idx + 1}. ${log}`).join('\n')}

All substantive content and analysis is the student's original work. AI tools were used only for permitted purposes as outlined in the assessment guidelines. The student takes full responsibility for the accuracy of all content.]
`;
    
    navigator.clipboard.writeText(declaration);
    toast.success('AI declaration copied to clipboard! Add it as a footnote.');
    toggleCheck('aiDeclaration');
  };

  const downloadDraft = () => {
    const blob = new Blob([finalDraft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${briefData?.moduleCode || 'Assignment'}_${Date.now()}.txt`;
    a.click();
    toast.success('Downloaded!');
  };

  const handleSubmit = () => {
    if (!allChecked) {
      toast.error('Complete all checklist items before finishing');
      return;
    }

    onComplete();
    toast.success('Assignment workflow complete! Good luck with your submission! 🎓');
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-lg p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-600 rounded-lg">
          <CheckCircle className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Stage 6: Final Review</h2>
          <p className="text-sm text-gray-600">Complete all checks before submission</p>
        </div>
      </div>

      {/* Submission Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Assignment Details</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Module:</strong> {briefData?.module_code || 'Not specified'} {briefData?.module_name || ''}</p>
          <p><strong>Deadline:</strong> {briefData?.due_date ? new Date(briefData.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not specified'}</p>
          <p><strong>Word Limit:</strong> {briefData?.word_limit || 'Not specified'} words</p>
          <p><strong>Citation Style:</strong> OSCOLA</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-3">
        <h3 className="font-semibold mb-4">Submission Checklist</h3>

        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={checklist.wordCount}
            onChange={() => toggleCheck('wordCount')}
            className="mt-1 w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Word count verified</p>
            <p className="text-xs text-gray-600">Checked that essay is within ±10% of word limit (including footnotes, excluding bibliography)</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={checklist.citations}
            onChange={() => toggleCheck('citations')}
            className="mt-1 w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">All citations in OSCOLA format</p>
            <p className="text-xs text-gray-600">Footnotes and bibliography follow OSCOLA standard</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={checklist.formatting}
            onChange={() => toggleCheck('formatting')}
            className="mt-1 w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Durham Law School style compliance</p>
            <p className="text-xs text-gray-600">1.5 spacing, proper formatting, tutor name included</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={checklist.plagiarismAware}
            onChange={() => toggleCheck('plagiarismAware')}
            className="mt-1 w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Plagiarism check awareness</p>
            <p className="text-xs text-gray-600">I understand my work will be checked and I have not plagiarized</p>
          </div>
        </label>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold mb-2">AI Usage Declaration Required</p>
              <p className="text-xs text-gray-700 mb-3">
                Durham's "Selective Use" policy requires you to cite all AI assistance. 
                We've tracked your usage:
              </p>
              <div className="bg-white p-3 rounded text-xs mb-3 max-h-32 overflow-y-auto">
                {aiUsageLog.length > 0 ? (
                  <ul className="space-y-1">
                    {aiUsageLog.map((log, idx) => (
                      <li key={idx}>• {log}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No AI assistance logged</p>
                )}
              </div>
              <button
                onClick={generateAIDeclaration}
                className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold"
              >
                Generate & Copy Declaration
              </button>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={checklist.aiDeclaration}
                  onChange={() => toggleCheck('aiDeclaration')}
                  className="w-4 h-4"
                />
                <span className="text-xs">AI declaration added to essay</span>
              </label>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={checklist.deadline}
            onChange={() => toggleCheck('deadline')}
            className="mt-1 w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Ready to submit before deadline</p>
            <p className="text-xs text-gray-600">File format correct (.doc/.docx), deadline noted</p>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button onClick={downloadDraft} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Download size={20} />
          Download Final Draft
        </button>

        <button
          onClick={handleSubmit}
          disabled={!allChecked}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          <CheckCircle size={20} />
          {allChecked ? 'Complete Workflow' : 'Complete Checklist First'}
        </button>
      </div>
    </div>
  );
}
