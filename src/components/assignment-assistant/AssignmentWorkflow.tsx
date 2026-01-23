/* eslint-disable @next/next/no-async-client-component */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import DurmahChat from '@/components/durmah/DurmahChat';
import AssignmentEditor, { AssignmentEditorHandle } from './AssignmentEditor';

export interface InsertPayload {
  source: 'durmah' | 'stage';
  html?: string;
  text?: string;
  mode?: 'cursor' | 'append';
  label?: string;
  addPrefix?: boolean;
}

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
  
  // Persistent Editor State (Hoisted)
  const [draftHtml, setDraftHtml] = useState('');
  const [draftText, setDraftText] = useState('');
  const editorRef = useRef<AssignmentEditorHandle>(null);

  // UI State for Layout
  const [leftColWidth, setLeftColWidth] = useState(25); // Percentage
  const [isDurmahMinimized, setIsDurmahMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Jump Logic State
  const [showJumpConfirm, setShowJumpConfirm] = useState<{target: number, name: string} | null>(null);
  
  // Initialize draft from loaded progress
  useEffect(() => {
    if (stageData?.draft) {
       setDraftHtml(stageData.draft.html || '');
       setDraftText(stageData.draft.text || '');
    }
  }, [stageData]);

  // Handle Editor Changes
  const handleEditorChange = (html: string, text: string) => {
      setDraftHtml(html);
      setDraftText(text);
      // Update local stageData state so it gets saved on next sync
      setStageData((prev: any) => ({
          ...prev,
          draft: { html, text, updatedAt: new Date().toISOString() }
      }));
  };

  const insertIntoDraft = (payload: InsertPayload) => {
      let content = payload.html || payload.text || '';
      
      // 1. Sanitization / Normalization if it's plain text
      if (!payload.html && payload.text) {
          // Escape HTML entities to safely insert as text
          const escaped = payload.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
          
          // Convert newlines to paragraphs/breaks
          // \n\n -> </p><p>
          content = escaped.split(/\n\s*\n/).map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`).join('');
      }

      // 2. Add Prefix
      if (payload.addPrefix) {
          const prefixLabel = payload.label || (payload.source === 'durmah' ? 'Durmah suggestion' : 'Stage notes');
          const prefixDisplay = `<p style="color: #666; font-style: italic; font-size: 0.9em; border-left: 2px solid #ccc; padding-left: 8px; margin-bottom: 4px;">[${prefixLabel} — rewrite in your own words]</p>`;
          content = prefixDisplay + content;
      }

      // 3. Insert
      if (payload.mode === 'append') {
          editorRef.current?.appendHtml(content);
      } else {
          // Default to cursor
          editorRef.current?.insertHtmlAtCursor(content);
      }

      toast.success("Inserted into Draft");
      
      // 4. Focus back
      requestAnimationFrame(() => {
          editorRef.current?.focus();
      });
  };

  const stages = [
    { num: 1, name: 'Understanding', completed: false },
    { num: 2, name: 'Research', completed: false },
    { num: 3, name: 'Structure', completed: false },
    { num: 4, name: 'Drafting', completed: false },
    { num: 5, name: 'Formatting', completed: false },
    { num: 6, name: 'Review', completed: false },
  ];

  // Resizing Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Calculate percentage based on window width
    // We want the left column to be roughly where the mouse is
    const newWidth = (e.clientX / window.innerWidth) * 100;
    // Limit between 15% and 50%
    if (newWidth > 15 && newWidth < 50) {
      setLeftColWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);


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
    // Skip upload and go straight to Stage 1 since brief already uploaded assignment creation
    setCurrentStage(1);
    setUploadMode(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
           {/* ... Header Content ... */}
           <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold">Assignment Assistant</h1>
              {safeAssignmentData.due_date && (
                 <CountdownTimer 
                    dueDate={safeAssignmentData.due_date} 
                    style="minimal" 
                    showSeconds={true}
                    className="text-white/90 text-xs"
                 />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                 onClick={onClose}
                 className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center gap-2 border border-white/20"
              >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium">Back to Details</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
              >
                <Save size={16} />
                <span className="text-sm font-medium">Save & Exit</span>
              </button>
              
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-white/20 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {!uploadMode && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
               {/* Stepper */}
               {stages.map((stage, idx) => (
                 <div key={stage.num} className="flex flex-col items-center gap-1 shrink-0 px-2 group cursor-pointer relative"
                    onClick={() => {
                        // Allow clicking ANY stage
                        if (stage.num === currentStage) return;
                        
                        // If moving back or to a completed stage, just go
                        if (stage.num < currentStage || stageData[`stage_${stage.num}_complete`]) {
                           setCurrentStage(stage.num);
                        } else {
                           // If jumping forward to unstarted stage, confirm
                           setShowJumpConfirm({ target: stage.num, name: stage.name });
                        }
                    }}
                 >
                    <div className="flex items-center">
                        <button
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${
                            currentStage === stage.num ? 'bg-white text-violet-600 ring-4 ring-white/30 scale-110' :
                            stage.num < currentStage ? 'bg-green-400 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                           {stage.num < currentStage ? <CheckCircle size={16} /> : stage.num}
                        </button>
                        {idx < stages.length - 1 && (
                            <div className={`h-0.5 w-12 transition-all ${
                                currentStage > stage.num ? 'bg-green-400/50' : 'bg-white/10'
                            }`} />
                        )}
                    </div>
                    {/* Label */}
                    <span className={`text-[10px] font-semibold transition-colors uppercase tracking-wider ${
                        currentStage === stage.num ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                    }`}>
                        {stage.name}
                    </span>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Resizable 3-Column Workspace */}
        <div className="flex-1 overflow-hidden flex flex-row relative">
          
          {/* LEFT: Stage Guide (Resizable) */}
          <div 
             className="min-w-[300px] border-r border-gray-200 overflow-y-auto bg-gray-50 flex flex-col shrink-0"
             style={{ width: `${leftColWidth}%` }}
          >
            <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <div className="bg-violet-100 text-violet-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                     {currentStage}
                   </div>
                   {stages.find(s=>s.num===currentStage)?.name}
                </h3>
            </div>
            <div className="p-4 flex-1">
              {!mode ? (
                <ModeSelector 
                  onSelectMode={handleModeSelection}
                  assignmentData={safeAssignmentData}
                />
              ) : uploadMode ? (
                <AssignmentUploader
                  assignmentId={assignmentId}
                  onUploadComplete={handleUploadComplete}
                  onCancel={onClose}
                />
              ) : (
                <>
                  {currentStage === 1 && (
                    <Stage1Understanding
                      assignmentId={assignmentId}
                      briefData={briefData || assignmentData}
                      onComplete={(data) => handleStageComplete(1, data)}
                      // @ts-ignore
                      onInsertToDraft={insertIntoDraft}
                    />
                  )}
                  {currentStage === 2 && (
                    <Stage2Research
                      assignmentId={assignmentId}
                      briefData={briefData || assignmentData}
                      onComplete={(data) => handleStageComplete(2, data)}
                      // @ts-ignore
                      onInsertToDraft={insertIntoDraft}
                    />
                  )}
                  {currentStage === 3 && (
                    <Stage3Structure
                      assignmentId={assignmentId}
                      briefData={briefData || assignmentData}
                      onComplete={(data) => handleStageComplete(3, data)}
                      // @ts-ignore
                      onInsertToDraft={insertIntoDraft}
                    />
                  )}
                  {currentStage === 4 && (
                    <Stage4Drafting
                       assignmentId={assignmentId}
                       briefData={briefData || assignmentData}
                       outline={stageData.stage3?.outlineStructure || []}
                       onComplete={(data) => handleStageComplete(4, data)}
                       // @ts-ignore
                       onInsertToDraft={insertIntoDraft}
                    />
                  )}
                  {currentStage === 5 && (
                    <Stage5Formatting
                      assignmentId={assignmentId}
                      briefData={briefData || assignmentData}
                      draft={draftText} // Pass persistent draft
                      onComplete={(data) => handleStageComplete(5, data)}
                    />
                  )}
                  {currentStage === 6 && (
                    <Stage6Review
                      assignmentId={assignmentId}
                      briefData={briefData || assignmentData}
                      aiUsageLog={stageData.stage4?.aiAssistanceUsed || []}
                      finalDraft={draftText} // Pass persistent draft
                      onComplete={() => handleStageComplete(6, {})}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* DRAG HANDLE */}
          <div 
             className={`w-1 bg-gray-200 hover:bg-violet-400 cursor-col-resize z-20 flex flex-col justify-center items-center transition-colors ${
                 isResizing ? 'bg-violet-500' : ''
             }`}
             onMouseDown={handleMouseDown}
          >
             <div className="w-0.5 h-8 bg-black/10 rounded-full" />
          </div>

          {/* MIDDLE: Persistent Editor (Expands to fill) */}
          <div className="flex-1 flex flex-col bg-white min-w-[400px] relative z-0">
             <div className="absolute inset-0 flex flex-col">
                <AssignmentEditor 
                   ref={editorRef}
                   valueHtml={draftHtml}
                   onChange={handleEditorChange}
                   className="h-full border-x border-gray-200"
                />
             </div>
          </div>

          {/* RIGHT: Durmah Mentor (Dockable) */}
          {/* If Minimized: Undock via CSS absolute positioning. If NOT minimized: Standard Flex column */}
          <div 
             className={`transition-all duration-300 ease-in-out bg-white border-l border-gray-200 flex flex-col shadow-inner z-30
                 ${isDurmahMinimized 
                     ? 'absolute bottom-4 right-4 w-[340px] h-auto max-h-[500px] border rounded-xl shadow-2xl !border-gray-200' 
                     : 'w-[350px] h-full border-t-0 border-b-0 rounded-none' 
                 }
             `}
          >
             <DurmahChat 
               contextType="assignment"
               contextTitle={safeAssignmentData.title}
               contextId={assignmentId}
               systemHint={`User is currently in Stage ${currentStage}: ${stages.find(s=>s.num===currentStage)?.name}. 
               
ASSIGNMENT CONTEXT:
Brief: ${safeAssignmentData.brief_rich || safeAssignmentData.question_text || 'No brief'}
Due: ${safeAssignmentData.due_date}

INSTRUCTION: Help them with this specific stage.`}
               className={`h-full border-0 ${isDurmahMinimized ? 'rounded-xl' : 'rounded-none'}`}
               
               // NEW Props for Minimization
               isMinimized={isDurmahMinimized}
               onToggleMinimize={() => setIsDurmahMinimized(!isDurmahMinimized)}
               // @ts-ignore
               onInsertToDraft={insertIntoDraft}
             />
          </div>

        </div>
      </div>
      {/* Jump Confirmation Modal */}
      {showJumpConfirm && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-gray-100">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4 mx-auto">
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Jump to {showJumpConfirm.name}?</h3>
                <p className="text-gray-600 text-center text-sm mb-6">
                    You're skipping ahead. This is great if you've already done work outside the app. 
                    <br/><br/>
                    We'll let you paste your work, but Durmah might have less context to help you.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowJumpConfirm(null)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            setCurrentStage(showJumpConfirm.target);
                            setShowJumpConfirm(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-violet-600 font-bold text-white hover:bg-violet-700 transition shadow-lg shadow-violet-200"
                    >
                        Yes, Jump
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
}
