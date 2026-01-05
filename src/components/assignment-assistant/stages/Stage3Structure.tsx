'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, GripVertical, Trash2, ArrowRight, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutosave } from '@/hooks/useAutosave';

interface OutlineSection {
  id: string;
  title: string;
  type: string;
  estimatedWords: number;
  notes: string;
}

interface Stage3StructureProps {
  assignmentId: string;
  briefData: any;
  onComplete: (data: any) => void;
}

export default function Stage3Structure({ assignmentId, briefData, onComplete }: Stage3StructureProps) {
  const [sections, setSections] = useState<OutlineSection[]>([
    { id: '1', title: 'Introduction', type: 'introduction', estimatedWords: 150, notes: '' },
    { id: '2', title: 'Issue', type: 'issue', estimatedWords: 200, notes: '' },
    { id: '3', title: 'Rule', type: 'rule', estimatedWords: 400, notes: '' },
    { id: '4', title: 'Application', type: 'application', estimatedWords: 600, notes: '' },
    { id: '5', title: 'Conclusion', type: 'conclusion', estimatedWords: 150, notes: '' },
  ]);

  const totalWords = sections.reduce((sum, s) => sum + s.estimatedWords, 0);
  const wordLimit = briefData?.wordLimit || 1500;

  // Autosave integration
  const { saving, saved, error: saveError, saveToAutosave } = useAutosave({
    assignmentId,
    stepKey: 'stage_3_structure',
    workflowKey: 'assignment_workflow',
  });

  // Trigger autosave when sections change
  useEffect(() => {
    if (sections.length > 0) {
      saveToAutosave({ sections, totalWords, wordLimit });
    }
  }, [sections, saveToAutosave]);

  const addSection = () => {
    const newSection: OutlineSection = {
      id: Date.now().toString(),
      title: 'New Section',
      type: 'custom',
      estimatedWords: 100,
      notes: '',
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, field: keyof OutlineSection, value: any) => {
    setSections(sections.map(s => s.id === id ? {...s, [field]: value} : s));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleComplete = () => {
    if (sections.length < 3) {
      toast.error('Add at least 3 sections');
      return;
    }

    if (Math.abs(totalWords - wordLimit) > wordLimit * 0.2) {
      toast.error(`Total estimated words (${totalWords}) should be close to limit (${wordLimit})`);
      return;
    }

    onComplete({
      outlineStructure: sections,
      wordCountEstimate: totalWords,
    });
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-lg p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <FileText className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Stage 3: Structure Your Essay</h2>
            <p className="text-sm text-gray-600">Using IRAC/ILAC framework</p>
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
          <button onClick={addSection} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2">
            <Plus size={20} />
            Add Section
          </button>
        </div>
      </div>

      {/* Word Count Summary */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Estimated Words:</span>
          <span className={`text-2xl font-bold ${Math.abs(totalWords - wordLimit) > wordLimit * 0.1 ? 'text-red-600' : 'text-green-600'}`}>
            {totalWords} / {wordLimit}
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${totalWords > wordLimit * 1.1 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{width: `${Math.min((totalWords / wordLimit) * 100, 100)}%`}}
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-6">
        {sections.map((section, idx) => (
          <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <GripVertical className="text-gray-400 cursor-move mt-2" size={20} />
              
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg font-semibold"
                    placeholder="Section title"
                  />
                  <select
                    value={section.type}
                    onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="introduction">Introduction</option>
                    <option value="issue">Issue</option>
                    <option value="rule">Rule</option>
                    <option value="application">Application</option>
                    <option value="conclusion">Conclusion</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    value={section.estimatedWords}
                    onChange={(e) => updateSection(section.id, 'estimatedWords', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border rounded-lg text-center"
                    placeholder="words"
                  />
                  <button onClick={() => deleteSection(section.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <textarea
                  value={section.notes}
                  onChange={(e) => updateSection(section.id, 'notes', e.target.value)}
                  placeholder="Notes: What will this section cover? Key points, cases to cite..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IRAC Guide */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">IRAC Structure Guide</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li><strong>Issue:</strong> Identify the legal question</li>
          <li><strong>Rule:</strong> State the relevant law (cases, statutes)</li>
          <li><strong>Application:</strong> Apply law to your facts</li>
          <li><strong>Conclusion:</strong> Summarize your answer</li>
        </ul>
      </div>

      <button onClick={handleComplete} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold">
        Continue to Drafting <ArrowRight size={20} />
      </button>
    </div>
  );
}
