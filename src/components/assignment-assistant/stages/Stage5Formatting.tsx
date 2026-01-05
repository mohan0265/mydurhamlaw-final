'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Wand2, ArrowRight, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface Stage5FormattingProps {
  assignmentId: string;
  briefData: any;
  draft: string;
  onComplete: (data: any) => void;
}

export default function Stage5Formatting({ assignmentId, briefData, draft, onComplete }: Stage5FormattingProps) {
  const [formattedText, setFormattedText] = useState(draft);
  const [citations, setCitations] = useState<any[]>([]);
  const [formatting, setFormatting] = useState(false);
  const [oscolaCompliant, setOscolaCompliant] = useState(false);

  // Autosave integration
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_5_formatting',
    workflowKey: 'assignment_workflow',
  });

  // Trigger autosave when formatted text or citations change
  useEffect(() => {
    if (formattedText !== draft || citations.length > 0) {
      saveToAutosave({ formattedText, citations, oscolaCompliant });
    }
  }, [formattedText, citations, oscolaCompliant, saveToAutosave]);

  const applyOSCOLAFormatting = async () => {
    setFormatting(true);
    try {
      const response = await fetch('/api/assignment/format-oscola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formattedText,
          assignmentId,
        }),
      });

      if (!response.ok) throw new Error('Formatting failed');

      const data = await response.json();
      setFormattedText(data.formattedText);
      setCitations(data.citations || []);
      setOscolaCompliant(true);
      toast.success('OSCOLA formatting applied!');

    } catch (error) {
      toast.error('Failed to format. Please check manually.');
    } finally {
      setFormatting(false);
    }
  };

  const handleComplete = () => {
    if (!oscolaCompliant) {
      const confirm = window.confirm('OSCOLA formatting not verified. Continue anyway?');
      if (!confirm) return;
    }

    onComplete({
      citationCount: citations.length,
      oscolaCompliant,
      formattedDraft: formattedText,
    });
  };

  return (
    <div className="h-full grid grid-cols-3 gap-4">
      {/* Left: Formatted Text (2 cols) */}
      <div className="col-span-2 bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <FileCheck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Stage 5: Formatting & Citations</h2>
              <p className="text-sm text-gray-600">
                {citations.length} citations | {oscolaCompliant ? 'OSCOLA Compliant ✓' : 'Not verified'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Autosave indicator */}
            <div className="text-xs flex items-center gap-1">
              {saving && (
                <><Cloud className="animate-pulse text-blue-600" size={14} /><span className="text-blue-600">Saving...</span></>
              )}
              {saved && !saving && (
                <><CheckCircle size={14} className="text-green-600" /><span className="text-green-600">Saved</span></>
              )}
              {saveError && (
                <><CloudOff size={14} className="text-orange-600" /><span className="text-orange-600">Saved locally</span></>
              )}
            </div>
            <button
              onClick={applyOSCOLAFormatting}
              disabled={formatting}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Wand2 size={20} />
              {formatting ? 'Formatting...' : 'Apply OSCOLA'}
            </button>
          </div>
        </div>

        {oscolaCompliant && (
          <div className="mb-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm font-semibold text-green-800">
              ✓ OSCOLA formatting applied
            </p>
          </div>
        )}

        <textarea
          value={formattedText}
          onChange={(e) => setFormattedText(e.target.value)}
          className="flex-1 w-full px-4 py-3 border rounded-lg font-serif text-gray-800 leading-relaxed resize-none"
        />

        <button onClick={handleComplete} className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
          Continue to Final Review <ArrowRight size={20} />
        </button>
      </div>

      {/* Right: OSCOLA Guide & Citations */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <h3 className="text-lg font-bold mb-4">OSCOLA Citation Guide</h3>
        
        <div className="flex-1 overflow-y-auto space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Cases</h4>
            <p className="text-gray-700 text-xs">
              Party v Party [Year] Citation, page
            </p>
            <p className="text-gray-500 text-xs italic">
              Example: Smith v Jones [2020] UKSC 1, [15]
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Statutes</h4>
            <p className="text-gray-700 text-xs">
              Name Year, section
            </p>
            <p className="text-gray-500 text-xs italic">
              Example: Human Rights Act 1998, s 3
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Books</h4>
            <p className="text-gray-700 text-xs">
              Author, Title (edition, Publisher Year) page
            </p>
            <p className="text-gray-500 text-xs italic">
              Example: AW Bradley, Constitutional Law (15th edn, Pearson 2011) 12
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Journal Articles</h4>
            <p className="text-gray-700 text-xs">
              Author, 'Title' [Year] Journal Vol, page
            </p>
            <p className="text-gray-500 text-xs italic">
              Example: V Bogdanor, 'Reform of the House of Lords' (1999) 70(4) Political Quarterly 375
            </p>
          </div>

          {citations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Your Citations</h4>
              <div className="space-y-2">
                {citations.map((cit, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                    <span className="font-semibold">[{idx + 1}]</span> {cit.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
