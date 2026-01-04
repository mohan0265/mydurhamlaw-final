'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle } from 'lucide-react';
import ModeSelector from './ModeSelector';
import AssignmentUploader from './AssignmentUploader';
import Stage1Understanding from './stages/Stage1Understanding';
import Stage2Research from './stages/Stage2Research';
import Stage3Structure from './stages/Stage3Structure';
import Stage4Drafting from './stages/Stage4Drafting';
import Stage5Formatting from './stages/Stage5Formatting';
import Stage6Review from './stages/Stage6Review';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface AssignmentWorkflowProps {
  assignmentId: string;
  assignmentData: any;
  onClose: () => void;
}

export default function AssignmentWorkflow({ 
  assignmentId, 
  assignmentData, 
  onClose 
}: AssignmentWorkflowProps) {
  const [mode, setMode] = useState<'normal' | 'express' | null>(null);
  const [currentStage, setCurrentStage] = useState(0); // 0 = upload, 1-6 = stages
  const [briefData, setBriefData] = useState<any>(null);
  const [stageData, setStageData] = useState<any>({});
  const [uploadMode, setUploadMode] = useState(true);

  const stages = [
    { num: 1, name: 'Understanding', completed: false },
    { num: 2, name: 'Research', completed: false },
    { num: 3, name: 'Structure', completed: false },
    { num: 4, name: 'Drafting', completed: false },
    { num: 5, name: 'Formatting', completed: false },
    { num: 6, name: 'Review', completed: false },
  ];

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Load brief
      const { data: brief } = await supabase
        .from('assignment_briefs')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (brief) {
        setBriefData(brief.parsed_data);
        setUploadMode(false);
      }

      // Load stage progress
      const { data: progress } = await supabase
        .from('assignment_stages')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (progress) {
        setCurrentStage(progress.current_stage);
        setStageData(progress.stage_data || {});
      }

    } catch (error) {
      console.error('Load progress error:', error);
    }
  };

  const saveProgress = async (stage: number, data: any) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Update stage progress
      await supabase
        .from('assignment_stages')
        .upsert({
          assignment_id: assignmentId,
          user_id: userData.user.id,
          current_stage: stage,
          [`stage_${stage}_complete`]: true,
          stage_data: { ...stageData, [`stage${stage}`]: data },
        });

    } catch (error) {
      console.error('Save progress error:', error);
    }
  };

  const handleUploadComplete = (parsed: any) => {
    setBriefData(parsed.parsedData);
    setUploadMode(false);
    setCurrentStage(1);
    toast.success('Ready to start! Beginning with Stage 1: Understanding');
  };

  const handleStageComplete = async (stage: number, data: any) => {
    const newStageData = { ...stageData, [`stage${stage}`]: data };
    setStageData(newStageData);
    await saveProgress(stage, data);

    if (stage < 6) {
      setCurrentStage(stage + 1);
      toast.success(`Stage ${stage} complete! Moving to Stage ${stage + 1}`);
    } else {
      toast.success('All stages complete! 🎉');
      setTimeout(onClose, 2000);
    }
  };

  const skipToManualEntry = () => {
    setUploadMode(false);
    setCurrentStage(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Assignment Assistant</h1>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X size={24} />
            </button>
          </div>

          {/* Progress Stepper */}
          {!uploadMode && (
            <div className="flex items-center gap-2 overflow-x-auto">
              {stages.map((stage, idx) => (
                <div key={stage.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStage > stage.num ? 'bg-green-500' :
                      currentStage === stage.num ? 'bg-white text-violet-600' :
                      'bg-white/30'
                    }`}>
                      {currentStage > stage.num ? <CheckCircle size={20} /> : stage.num}
                    </div>
                    <span className="text-xs mt-1 whitespace-nowrap">{stage.name}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`w-12 h-1 mx-2 ${currentStage > stage.num ? 'bg-green-500' : 'bg-white/30'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6">
          {!mode ? (
            <ModeSelector 
              onSelectMode={(selectedMode) => setMode(selectedMode)}
              assignmentData={assignmentData}
            />
          ) : uploadMode ? (
            <div className="h-full flex flex-col justify-center">
              <AssignmentUploader
                assignmentId={assignmentId}
                onUploadComplete={handleUploadComplete}
                onCancel={onClose}
              />
              <button
                onClick={skipToManualEntry}
                className="mt-4 text-center text-sm text-gray-600 hover:text-violet-600"
              >
                Skip upload and enter details manually
              </button>
            </div>
          ) : (
            <>
              {currentStage === 1 && (
                <Stage1Understanding
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  onComplete={(data) => handleStageComplete(1, data)}
                />
              )}
              {currentStage === 2 && (
                <Stage2Research
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  onComplete={(data) => handleStageComplete(2, data)}
                />
              )}
              {currentStage === 3 && (
                <Stage3Structure
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  onComplete={(data) => handleStageComplete(3, data)}
                />
              )}
              {currentStage === 4 && (
                <Stage4Drafting
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  outline={stageData.stage3?.outlineStructure || []}
                  onComplete={(data) => handleStageComplete(4, data)}
                />
              )}
              {currentStage === 5 && (
                <Stage5Formatting
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  draft={stageData.stage4?.draft || ''}
                  onComplete={(data) => handleStageComplete(5, data)}
                />
              )}
              {currentStage === 6 && (
                <Stage6Review
                  assignmentId={assignmentId}
                  briefData={briefData || assignmentData}
                  aiUsageLog={stageData.stage4?.aiAssistanceUsed || []}
                  finalDraft={stageData.stage5?.formattedDraft || stageData.stage4?.draft || ''}
                  onComplete={() => handleStageComplete(6, {})}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
