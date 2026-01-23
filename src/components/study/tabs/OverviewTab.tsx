import { Assignment } from '@/types/assignments';
import { differenceInDays, format } from 'date-fns';
import { calculateDeadlineStatus } from '@/lib/utils/deadline';
import { Calendar, Clock, BookOpen, Target, Percent, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface OverviewTabProps {
  assignment: Assignment;
}

export default function OverviewTab({ assignment }: OverviewTabProps) {
  const due = new Date(assignment.due_date);
  const status = calculateDeadlineStatus(assignment.due_date);
  const [finalDraft, setFinalDraft] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch final draft if assignment is completed
  useEffect(() => {
    if (assignment.status === 'completed' || assignment.status === 'submitted') {
      fetchFinalDraft();
    }
  }, [assignment.id, assignment.status]);

  const fetchFinalDraft = async () => {
    try {
      const res = await fetch(`/api/assignment/progress?assignmentId=${assignment.id}`);
      const data = await res.json();
      
      if (data.success && data.progress) {
        // Look for formatting or review stage content
        const formattingStep = data.progress.find((p: any) => p.step_key === 'formatting');
        const reviewStep = data.progress.find((p: any) => p.step_key === 'review');
        const draftingStep = data.progress.find((p: any) => p.step_key === 'drafting');
        
        // Prefer formatting, then review, then drafting
        const finalContent = formattingStep?.content?.html || 
                            reviewStep?.content?.html || 
                            draftingStep?.content?.html;
        
        if (finalContent) {
          setFinalDraft(finalContent);
        }
      }
    } catch (error) {
      console.error('Failed to fetch final draft:', error);
    }
  };

  const handleDownloadDraft = async () => {
    if (!finalDraft) {
      toast.error('No final draft available');
      return;
    }

    setDownloading(true);
    try {
      // Convert HTML to plain text for DOCX
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalDraft;
      const textContent = tempDiv.innerText;

      // Generate DOCX
      const paragraphs = textContent.split('\n').filter(p => p.trim()).map(text => 
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: "Times New Roman",
              size: 24, // 12pt = 24 half-points
            }),
          ],
          spacing: {
            line: 480, // Double spacing
            after: 200,
          },
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
        styles: {
          default: {
            document: {
              run: {
                font: "Times New Roman",
                size: 24,
              }
            }
          }
        }
      });

      const blob = await Packer.toBlob(doc);
      const filename = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_final_draft.docx`;
      saveAs(blob, filename);
      toast.success('Final draft downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download. Please try from Assignment Assistant.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${status.bgClass}`}>
          <div className={`${status.colorClass.replace('text-', 'text-opacity-80 text-')} mb-2`}><Clock size={20} /></div>
          <p className={`text-xs ${status.colorClass} font-bold uppercase tracking-wider`}>Time Remaining</p>
          <p className={`text-xl font-bold ${status.colorClass}`}>
             {status.text}
          </p>
          <p className="text-xs opacity-70 mt-1 text-gray-600">{format(due, 'MMM d, HH:mm')}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="text-purple-500 mb-2"><Target size={20} /></div>
          <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Word Target</p>
          <p className="text-xl font-bold text-purple-900">{assignment.word_count_target ? `${assignment.word_count_target}` : 'Set Target'}</p>
          <p className="text-xs opacity-70 mt-1">words</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="text-amber-500 mb-2"><Percent size={20} /></div>
          <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Weighting</p>
          <p className="text-xl font-bold text-amber-900">{assignment.weightage || 'N/A'}</p>
          <p className="text-xs opacity-70 mt-1">of module grade</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <div className="text-emerald-500 mb-2"><BookOpen size={20} /></div>
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Module</p>
          <p className="text-lg font-bold text-emerald-900 truncate" title={assignment.module_name}>{assignment.module_code || '---'}</p>
           <p className="text-xs opacity-70 mt-1 truncate">{assignment.module_name}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Assignment Velocity</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
               Status: <span className="uppercase">{assignment.status.replace('_', ' ')}</span>
            </span>
         </div>
         
         <div className="space-y-4">
             <div>
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                   <span>Checklist Completion</span>
                   <span>0%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                   <span>Milestones Met</span>
                   <span>0 / 0</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
                </div>
             </div>
         </div>

         {/* Download Button for Completed Assignments */}
         {(assignment.status === 'completed' || assignment.status === 'submitted') && finalDraft && (
           <div className="mt-6 pt-6 border-t border-gray-200">
             <button
               onClick={handleDownloadDraft}
               disabled={downloading}
               className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {downloading ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   <span>Generating DOCX...</span>
                 </>
               ) : (
                 <>
                   <Download size={18} />
                   <span>Download Final Draft</span>
                 </>
               )}
             </button>
             <p className="text-xs text-center text-gray-500 mt-2">
               Quick download • Times New Roman • 12pt • Double spaced
             </p>
           </div>
         )}
      </div>
    </div>
  )
}
