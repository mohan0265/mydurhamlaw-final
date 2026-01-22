/* eslint-disable @next/next/no-async-client-component */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { X, CheckCircle, Circle, ArrowLeft, Home, Save } from 'lucide-react';
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
import CountdownTimer from '@/components/ui/CountdownTimer';

// Props interface - these functions are valid in 'use client' components
interface AssignmentWorkflowProps {
  assignmentId: string;
  assignmentData: any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onClose: () => void;
}

export default function AssignmentWorkflow({ 
  assignmentId, 
  assignmentData, 
  onClose 
}: AssignmentWorkflowProps) {
  const router = useRouter();
  // Defensive null checks - prevent crashes if data is incomplete
  const safeAssignmentData = {
    title: assignmentData?.title || 'Untitled Assignment',
    module_code: assignmentData?.module_code || '',
    module_name: assignmentData?.module_name || '',
    due_date: assignmentData?.due_date || null,
    question_text: assignmentData?.question_text || '',
    word_limit: assignmentData?.word_limit || 1500,
    ...assignmentData
  };

  const [mode, setMode] = useState<'normal' | 'express' | null>(null);
  const [currentStage, setCurrentStage] = useState(0); // 0 = upload, 1-6 = stages
  const [briefData, setBriefData] = useState<any>(null);
  const [stageData, setStageData] = useState<any>({});
  const [uploadMode, setUploadMode] = useState(false); // Start with false - students already uploaded during creation

  const stages = [
    { num: 1, name: 'Understanding', completed: false },
    { num: 2, name: 'Research', completed: false },
    { num: 3, name: 'Structure', completed: false },
    { num: 4, name: 'Drafting', completed: false },
    { num: 5, name: 'Formatting', completed: false },
    { num: 6, name: 'Review', completed: false },
  ];

  // Read stage from URL on mount
  useEffect(() => {
    if (router.query.stage && !isNaN(Number(router.query.stage))) {
      const urlStage = Number(router.query.stage);
      if (urlStage >= 1 && urlStage <= 6) {
        setCurrentStage(urlStage);
      }
    }
  }, [router.query.stage]);

  useEffect(() => {
    if (assignmentId) {
      loadProgress();
    }
  }, [assignmentId]);

  const loadProgress = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Load brief - use maybeSingle() to handle cases where no data exists yet
      const { data: brief, error: briefError } = await supabase
        .from('assignment_briefs')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (briefError) {
        console.error('Brief load error:', briefError);
      } else if (brief) {
        setBriefData(brief.parsed_data);
        setUploadMode(false);
      }

      // Load stage progress - CRITICAL: Must filter by user_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        console.log('No authenticated user - cannot load progress');
        return;
      }

      const { data: progress, error: progressError } = await supabase
        .from('assignment_stages')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', userData.user.id) // CRITICAL FIX: Filter by user
        .maybeSingle();

      console.log('[RESUME DEBUG] Progress query result:', { progress, progressError, userId: userData.user.id });

      if (progressError) {
        console.error('Progress load error:', progressError);
      } else if (progress && progress.current_stage > 0) {
        // RESUME PROGRESS: Student has already started this assignment
        // Skip mode selection and go directly to their saved stage
        console.log(`✅ Resuming at Stage ${progress.current_stage}`);
        setMode('normal'); // Assume normal mode if resuming
        setCurrentStage(progress.current_stage);
        setStageData(progress.stage_data || {});
        setUploadMode(false);
        toast.success(`Resuming at Stage ${progress.current_stage}: ${stages[progress.current_stage - 1]?.name}`);
      } else {
        console.log('[RESUME DEBUG] No saved progress found or current_stage is 0');
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
    
    // CRITICAL: Save the NEXT stage (where we're going), not the completed stage
    // This ensures resume opens at the correct location
    const nextStage = stage < 6 ? stage + 1 : 6;
    await saveProgress(nextStage, data);

    if (stage < 6) {
      setCurrentStage(nextStage);
      // Update URL with new stage
      router.push(
        `/assignments?assignmentId=${assignmentId}&view=workflow&stage=${nextStage}`,
        undefined,
        { shallow: true }
      );
      toast.success(`Stage ${stage} complete! Moving to Stage ${nextStage}`);
    } else {
      // Stage 6 complete - mark assignment as completed
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase
            .from('assignments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', assignmentId)
            .eq('user_id', userData.user.id);
        }
      }
      toast.success('All stages complete! 🎉');
      setTimeout(onClose, 2000);
    }
  };

  const skipToManualEntry = () => {
    setUploadMode(false);
    setCurrentStage(1);
  };

  const handleModeSelection = (selectedMode: 'normal' | 'express') => {
    setMode(selectedMode);
    // Skip upload and go straight to Stage 1 since brief already uploaded during assignment creation
    setCurrentStage(1);
    setUploadMode(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">Assignment Assistant</h1>
              {safeAssignmentData.due_date && (
                 <CountdownTimer 
                    dueDate={safeAssignmentData.due_date} 
                    style="minimal" 
                    showSeconds={true}
                    className="text-white/90 text-sm"
                 />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Save & Exit Button */}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                title="Save progress and return to assignment"
              >
                <Save size={18} />
                <span className="text-sm font-medium">Save & Exit</span>
              </button>
              
              {/* Back to Dashboard */}
              <button
                onClick={() => {
                  router.push('/dashboard');
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                title="Exit to dashboard"
              >
                <Home size={18} />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              
              {/* Close X Button */}
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/20 rounded-full transition"
                title="Close and return"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Progress Stepper */}
          {!uploadMode && (
            <div className="flex items-center gap-2 overflow-x-auto">
              {stages.map((stage, idx) => (
                <div key={stage.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        if (stage.num < currentStage) {
                          // Allow going back to previous stages
                          setCurrentStage(stage.num);
                          // Update URL
                          router.push(
                            `/assignments?assignmentId=${assignmentId}&view=workflow&stage=${stage.num}`,
                            undefined,
                            { shallow: true }
                          );
                          toast.success(`Returned to Stage ${stage.num}: ${stage.name}`);
                        }
                      }}
                      disabled={stage.num > currentStage}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        currentStage > stage.num ? 'bg-green-500 cursor-pointer hover:bg-green-600' :
                        currentStage === stage.num ? 'bg-white text-violet-600' :
                        'bg-white/30 cursor-not-allowed'
                      }`}
                    >
                      {currentStage > stage.num ? <CheckCircle size={20} /> : stage.num}
                    </button>
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
        <div className="flex-1 overflow-y-auto p-6">
          {!mode ? (
            <ModeSelector 
              onSelectMode={handleModeSelection}
              assignmentData={safeAssignmentData}
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
