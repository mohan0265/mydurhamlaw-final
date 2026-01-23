'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, GripVertical, Trash2, ArrowRight, CheckCircle, Cloud, CloudOff, LayoutTemplate, ArrowUpRight } from 'lucide-react';
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
  onInsertToDraft?: (payload: any) => void;
}

export default function Stage3Structure({ assignmentId, briefData, onComplete, onInsertToDraft }: Stage3StructureProps) {
  const [sections, setSections] = useState<OutlineSection[]>([
    { id: '1', title: 'Introduction', type: 'introduction', estimatedWords: 150, notes: '' },
    { id: '2', title: 'Issue', type: 'issue', estimatedWords: 200, notes: '' },
    { id: '3', title: 'Rule', type: 'rule', estimatedWords: 400, notes: '' },
    { id: '4', title: 'Application', type: 'application', estimatedWords: 600, notes: '' },
    { id: '5', title: 'Conclusion', type: 'conclusion', estimatedWords: 150, notes: '' },
  ]);

  const totalWords = sections.reduce((sum, s) => sum + s.estimatedWords, 0);
  const wordLimit = briefData?.word_limit || 1500;

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

  const generateSkeleton = () => {
    if (!onInsertToDraft) return;

    let skeletonHtml = '';
    sections.forEach(section => {
        // Heading
        skeletonHtml += `<h2>${section.title}</h2>`;
        
        // Notes if any
        if (section.notes) {
            skeletonHtml += `<p style="color: #666; font-style: italic; background: #f9f9f9; padding: 4px;">[Note: ${section.notes}]</p>`;
        }
        
        // OSCOLA for main body paragraphs
        if (['issue', 'rule', 'application', 'argument'].includes(section.type) || section.type === 'custom') {
            skeletonHtml += `<p><strong>Authorities (OSCOLA):</strong> <span style="color: #999;">[Add cases/statutes here]</span></p>`;
        }

        // Placeholder for Words
        skeletonHtml += `<p><em>[Target: ${section.estimatedWords} words]</em></p><p><br/></p>`;
    });

    onInsertToDraft({
        source: 'stage',
        html: skeletonHtml,
        mode: 'append', // Skeleton builds the whole doc usually
        label: 'Structure Skeleton',
        addPrefix: false 
    });
  };

  const insertSection = (section: OutlineSection) => {
     if (!onInsertToDraft) return;
     let html = `<h3>${section.title}</h3>`;
     if (section.notes) html += `<p>${section.notes}</p>`;
     onInsertToDraft({
         source: 'stage',
         html: html,
         mode: 'cursor',
         label: `Section: ${section.title}`,
         addPrefix: false
     });
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
            <LayoutTemplate className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Stage 3: Structure</h2>
            <p className="text-sm text-gray-600">Plan your essay</p>
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
          
          {onInsertToDraft && (
             <button 
               onClick={generateSkeleton}
               className="px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
               title="Generate full skeleton in Editor"
             >
                <FileText size={16} />
                Generate Draft Skeleton
             </button>
          )}

          <button onClick={addSection} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition">
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
          <div key={section.id} className="border rounded-lg p-4 bg-gray-50 group hover:shadow-sm transition-shadow">
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
                  
                  {onInsertToDraft && (
                      <button 
                        onClick={() => insertSection(section)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Insert just this section"
                      >
                          <ArrowUpRight size={20} />
                      </button>
                  )}

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

      <button onClick={handleComplete} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition">
        Continue to Drafting <ArrowRight size={20} />
      </button>
    </div>
  );
}
