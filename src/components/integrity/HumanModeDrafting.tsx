import React, { useState } from 'react';
import { AlertTriangle, Book, CheckCircle, FileText, Lightbulb } from 'lucide-react';
import AssistanceLevel from './AssistanceLevel';
import { type HelpLevel } from '@/lib/integrity/humanMode';
import { adviseOriginality, type OriginalityAdvice } from '@/lib/integrity/originality';

interface HumanModeDraftingProps {
  onAssistanceRequest: (query: string, level: HelpLevel) => void;
  className?: string;
}

const HumanModeDrafting: React.FC<HumanModeDraftingProps> = ({
  onAssistanceRequest,
  className = ''
}) => {
  const [assistanceLevel, setAssistanceLevel] = useState<HelpLevel>('L1_SELF');
  const [studentNotes, setStudentNotes] = useState('');
  const [query, setQuery] = useState('');
  const [coachOutput, setCoachOutput] = useState('');
  const [originalityAdvice, setOriginalityAdvice] = useState<OriginalityAdvice | null>(null);
  const [isCheckingOriginality, setIsCheckingOriginality] = useState(false);

  const handleAssistanceRequest = () => {
    if (!query.trim()) return;
    
    onAssistanceRequest(query, assistanceLevel);
    setQuery('');
  };

  const handleOriginalityCheck = async () => {
    if (!studentNotes.trim()) return;
    
    setIsCheckingOriginality(true);
    try {
      const advice = await adviseOriginality(studentNotes);
      setOriginalityAdvice(advice);
    } catch (error) {
      console.error('Error checking originality:', error);
    } finally {
      setIsCheckingOriginality(false);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-blue-900">Human Mode Drafting™</h2>
            <p className="text-blue-700 text-sm">
              Submittable text must be your own words. We provide learning guidance only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Student Work */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Notes */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Notes & Draft
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Write your thoughts, outline, and draft here. This is your workspace.
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Start writing your notes, outline, or draft here. Remember - this should be in your own words and reflect your understanding..."
                className="w-full h-64 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleOriginalityCheck}
                  disabled={!studentNotes.trim() || isCheckingOriginality}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCheckingOriginality ? 'Checking...' : 'Check Originality & Get Guidance'}
                </button>
                
                <div className="flex-1 text-right">
                  <span className="text-sm text-gray-500">
                    {studentNotes.trim().split(/\s+/).length} words
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Originality Advice */}
          {originalityAdvice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Originality Guidance</h4>
                {originalityAdvice.estimated_overlap && (
                  <span className="text-sm text-green-700">
                    (~{originalityAdvice.estimated_overlap}% potential overlap detected)
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {originalityAdvice.guidance.map((advice, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    {advice}
                  </li>
                ))}
              </ul>
              
              {originalityAdvice.risky_segments && originalityAdvice.risky_segments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-green-200">
                  <p className="font-medium text-green-900 mb-2">Areas to revise:</p>
                  <ul className="space-y-1">
                    {originalityAdvice.risky_segments.map((segment, index) => (
                      <li key={index} className="text-sm text-green-700">
                        • {segment.reason} (around character {segment.start}-{segment.end})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Query Input */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Ask for Guidance
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ask for help with understanding, structuring, or citing your work.
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for guidance on your work. For example: 'How should I structure my argument about...' or 'What cases should I cite for...'"
                className="w-full h-20 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAssistanceRequest}
                disabled={!query.trim()}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Get Guidance
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistance & Controls */}
        <div className="space-y-6">
          {/* Assistance Level */}
          <AssistanceLevel
            value={assistanceLevel}
            onChange={setAssistanceLevel}
          />

          {/* Coach Output */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg">
            <div className="px-4 py-3 border-b border-amber-200">
              <h3 className="font-medium text-amber-900 flex items-center gap-2">
                <Book className="w-4 h-4" />
                Coaching Guidance
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Non-submittable guidance to help your learning
              </p>
            </div>
            <div className="p-4">
              {coachOutput ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-amber-800">{coachOutput}</div>
                </div>
              ) : (
                <p className="text-amber-600 italic">
                  Ask a question above to receive personalized guidance at your selected assistance level.
                </p>
              )}
            </div>
            
            {coachOutput && (
              <div className="px-4 py-3 bg-amber-100 border-t border-amber-200">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    What to cite & how (OSCOLA)
                  </span>
                </div>
                <p className="text-amber-700 text-xs mt-1">
                  Remember to cite any cases, statutes, or academic sources mentioned above using OSCOLA format.
                </p>
              </div>
            )}
          </div>

          {/* Citation Helper */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">OSCOLA Quick Reference</h4>
            <div className="text-xs text-gray-600 space-y-2">
              <div>
                <strong>Cases:</strong> Name [Year] Citation
                <br />
                <em>eg: Donoghue v Stevenson [1932] AC 562</em>
              </div>
              <div>
                <strong>Statutes:</strong> Act Year
                <br />
                <em>eg: Human Rights Act 1998</em>
              </div>
              <div>
                <strong>Books:</strong> Author, Title (Publisher Year)
                <br />
                <em>eg: A Smith, Contract Law (OUP 2023)</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanModeDrafting;