'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, FileAudio, Calendar, User, Book, ChevronDown, ChevronUp,
  MessageSquare, Lightbulb, HelpCircle, GraduationCap, BookOpen, Loader2, Sparkles,
  ShieldAlert, AlertTriangle, PlusCircle, CheckCircle, ExternalLink
} from 'lucide-react';
// ... imports
import { QuizMeCard } from '@/components/quiz/QuizMeCard';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '@/lib/supabase/client';
import LectureChatWidget from '@/components/study/LectureChatWidget';
// ... existing imports


interface ExamSignal {
  signal_strength: number;
  topic_title: string;
  why_it_matters: string;
  what_to_master: string[];
  common_traps: string[];
  evidence_quotes?: string[];
  practice_prompts: { type: string; prompt: string }[];
}

interface LectureDetail {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  panopto_url?: string; // Added field
  status: string;
  transcript?: string;
  word_count?: number;
  notes?: {
    summary?: string;
    key_points?: string[];
    discussion_topics?: string[];
    exam_prompts?: string[];
    glossary?: Array<{ term: string; definition: string }>;
    engagement_hooks?: string[];
    exam_signals?: ExamSignal[];
  };
}

export default function LectureDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'keypoints' | 'hooks' | 'discussion' | 'exam' | 'glossary'>('summary');
  
  // URL Editing State
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState('');

  // New State for Filters and UI
  const [signalFilter, setSignalFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchLecture = async () => {
      try {
        const res = await fetch(`/api/lectures/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setLecture(data.lecture);
          setEditedUrl(data.lecture.panopto_url || '');
        }
      } catch (error) {
        console.error('Failed to fetch lecture:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLecture();
  }, [id]);

  const handleUpdateUrl = async () => {
      if (!lecture) return;
      const supabase = getSupabaseClient();
      const toastId = toast.loading('Updating source link...');
      
      try {
          const { error } = await supabase
              .from('lectures')
              .update({ panopto_url: editedUrl })
              .eq('id', lecture.id);
          
          if (error) throw error;
          
          setLecture({ ...lecture, panopto_url: editedUrl });
          setIsEditingUrl(false);
          toast.success('Source link updated', { id: toastId });
      } catch (err) {
          console.error(err);
          toast.error('Failed to update link', { id: toastId });
      }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { timeZone: 'Europe/London', 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // ... handleAddToRevision ...
  const handleAddToRevision = async (signal: ExamSignal) => {
    // ... existing implementation
    const toastId = toast.loading('Adding to revision...');
    try {
        const res = await fetch('/api/study/revision', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                lecture_id: lecture?.id,
                topic_title: signal.topic_title,
                notes: `Why it matters: ${signal.why_it_matters}`
            })
        });
        if(res.ok) {
            toast.success('Added to Revision list', { id: toastId });
        } else {
            toast.error('Failed to add', { id: toastId });
        }
    } catch(e) {
        toast.error('Error adding to revision', { id: toastId });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>;
  if (!lecture) return <div className="max-w-4xl mx-auto py-8 text-center text-gray-500">Lecture not found</div>;

  const notes = lecture.notes;
  const signals = notes?.exam_signals || [];
  
  const filteredSignals = signals.filter(s => {
      if (signalFilter === 'All') return true;
      if (signalFilter === 'High') return s.signal_strength >= 4;
      if (signalFilter === 'Medium') return s.signal_strength === 3;
      if (signalFilter === 'Low') return s.signal_strength <= 2;
      return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button onClick={() => router.push('/study/lectures')} variant="ghost" className="mb-4 text-sm flex items-center gap-1 text-gray-600 hover:text-purple-700">
        <ArrowLeft className="w-4 h-4" /> Back to Lectures
      </Button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileAudio className="w-7 h-7 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
               {lecture.module_code && <span className="flex items-center gap-1"><Book className="w-4 h-4" />{lecture.module_code}</span>}
               {lecture.lecturer_name && <span className="flex items-center gap-1"><User className="w-4 h-4" />{lecture.lecturer_name}</span>}
               {lecture.lecture_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(lecture.lecture_date)}</span>}
            </div>

            {/* SOURCE LINK ROW */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Source Link:</span>
                
                {isEditingUrl ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input 
                            type="text" 
                            value={editedUrl} 
                            onChange={(e) => setEditedUrl(e.target.value)}
                            className="flex-1 text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            placeholder="https://durham.cloud.panopto.eu/..."
                        />
                        <Button size="sm" onClick={handleUpdateUrl} className="bg-purple-600 text-white hover:bg-purple-700">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingUrl(false)}>Cancel</Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {lecture.panopto_url ? (
                            <a href={lecture.panopto_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline category-link">
                                <ExternalLink className="w-3.5 h-3.5" />
                                {lecture.panopto_url.includes('panopto') ? 'Watch on Panopto' : 'Open Source Link'}
                            </a>
                        ) : (
                            <span className="text-sm text-gray-400 italic">No source link provided</span>
                        )}
                        
                        <button 
                            onClick={() => { setIsEditingUrl(true); setEditedUrl(lecture.panopto_url || ''); }}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                            title="Edit URL"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>

      {/* TABS */}
      {notes && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm">
          <div className="flex border-b overflow-x-auto">
            {[
              { key: 'summary', label: 'Summary', icon: BookOpen },
              { key: 'keypoints', label: 'Key Points', icon: Lightbulb },
              { key: 'hooks', label: '✨ Why It Matters', icon: Sparkles },
              { key: 'discussion', label: 'Discussion', icon: MessageSquare },
              { key: 'exam', label: 'Exam Prep', icon: GraduationCap },
              { key: 'glossary', label: 'Glossary', icon: HelpCircle },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* EXISTING TABS OMITTED FOR BREVITY, WILL KEEP IN FINAL FILE */}
            {activeTab === 'summary' && notes.summary && <p className="text-gray-700 whitespace-pre-wrap">{notes.summary}</p>}
            {activeTab === 'keypoints' && notes.key_points?.map((p,i)=><div key={i} className="mb-2 flex gap-2"><div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div><p>{p}</p></div>)}

            {/* EXAM PREP TAB */}
            {activeTab === 'exam' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Quiz Me Spotlight Integration */}
                    <QuizMeCard 
                        lectureId={lecture.id} 
                        moduleCode={lecture.module_code} 
                        className="mb-8" 
                    />

                    {/* Tab Header & Subtitle */}
                    <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h3 className="text-purple-900 font-bold flex items-center gap-2">
                           <GraduationCap className="w-5 h-5"/> Exam Prep
                        </h3>
                        <p className="text-purple-700 text-sm mt-1">Practise understanding, application, and structure — aligned to what you learned in this lecture.</p>
                    </div>

                    {/* 1. ACADEMIC INTEGRITY DISCLAIMER */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Built for academic integrity</p>
                            <p className="opacity-90">We highlight lecturer emphasis to guide revision. We don’t predict exam papers or generate work to submit as your own. <a href="#" className="underline hover:text-blue-900">Read our Integrity Guidelines</a></p>
                        </div>
                    </div>

                    {/* 2. SIGNALS SECTION */}
                    <div>
                         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    Lecturer Emphasis & Exam Signals
                                    <span className="text-gray-400 cursor-help" title="We detect emphasis cues in the lecture (e.g., repeated points, 'key distinction', 'common mistake', assessment-related phrasing). This helps you focus revision on what was stressed — not 'guess' the exam.">
                                        <HelpCircle className="w-4 h-4" />
                                    </span>
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Highlights concepts your lecturer strongly emphasized — with evidence from the transcript and practice prompts.</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {['All', 'High', 'Medium', 'Low'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setSignalFilter(f as any)} 
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${signalFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {f === 'High' ? 'High emphasis' : f === 'Medium' ? 'Medium' : f === 'Low' ? 'Low' : 'All'}
                                    </button>
                                ))}
                            </div>
                         </div>

                         {signals.length > 0 ? (
                             <div className="space-y-4">
                                {filteredSignals.map((signal, idx) => {
                                    // Badge Logic
                                    let badgeColor = 'bg-blue-100 text-blue-700';
                                    let badgeText = 'Possible relevance (Strength 1)';
                                    if (signal.signal_strength >= 5) { badgeColor = 'bg-red-100 text-red-800'; badgeText = 'High emphasis (Strength 5)'; }
                                    else if (signal.signal_strength === 4) { badgeColor = 'bg-orange-100 text-orange-800'; badgeText = 'Strong emphasis (Strength 4)'; }
                                    else if (signal.signal_strength === 3) { badgeColor = 'bg-amber-100 text-amber-800'; badgeText = 'Noted emphasis (Strength 3)'; }
                                    else if (signal.signal_strength === 2) { badgeColor = 'bg-blue-100 text-blue-800'; badgeText = 'Light emphasis (Strength 2)'; }
                                    
                                    return (
                                    <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-all shadow-sm bg-white group">
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${badgeColor}`}>
                                                        {badgeText}
                                                    </span>
                                                    <h4 className="font-bold text-gray-900 text-lg">{signal.topic_title}</h4>
                                                </div>
                                                <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block max-w-full">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Evidence from transcript</span>
                                                    <span className="italic">&quot;{signal.evidence_quotes?.[0] || 'Evidence missing'}&quot;</span>
                                                </div>
                                            </div>
                                            <Button 
                                               size="sm" 
                                               variant="ghost" 
                                               onClick={() => setExpandedSignal(expandedSignal === signal.topic_title ? null : signal.topic_title)}
                                               className="text-gray-400 hover:text-purple-600"
                                            >
                                                {expandedSignal === signal.topic_title ? 'Hide details' : 'Show details'}
                                                {expandedSignal === signal.topic_title ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                                            </Button>
                                        </div>

                                        {expandedSignal === signal.topic_title && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-5 animate-fadeIn">
                                                {/* Why it matters */}
                                                <div>
                                                    <h5 className="font-bold text-gray-900 mb-1 flex items-center gap-2">Why it matters</h5>
                                                    <p className="text-gray-700 leading-relaxed">{signal.why_it_matters}</p>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* What to Master */}
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                           <CheckCircle className="w-4 h-4 text-green-600"/> What to master
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {signal.what_to_master.map((m, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-gray-700">
                                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0"/>
                                                                    <span>{m}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Common Traps */}
                                                    {signal.common_traps && signal.common_traps.length > 0 && (
                                                        <div>
                                                            <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                               <AlertTriangle className="w-4 h-4 text-red-500"/> Common traps
                                                            </h5>
                                                            <ul className="space-y-2">
                                                                {signal.common_traps.map((m, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-gray-700">
                                                                        <div className="w-1.5 h-1.5 bg-red-300 rounded-full mt-1.5 shrink-0"/>
                                                                        <span>{m}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Practice Prompts */}
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <h5 className="font-bold text-gray-900 mb-3">Practice prompts</h5>
                                                    <div className="space-y-3">
                                                        {signal.practice_prompts.map((p, i) => (
                                                            <div key={i} className="flex gap-3 items-baseline bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 shrink-0 min-w-[5rem]">{p.type}</span>
                                                                <span className="text-gray-800">{p.prompt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap gap-3">
                                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                                                            Practise
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleAddToRevision(signal)} className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                                                            <PlusCircle className="w-4 h-4 mr-2" /> Add to Revision
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-800">
                                                            <MessageSquare className="w-4 h-4 mr-2" /> Ask Durmah
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )})}
                             </div>
                         ) : (
                             // Empty State
                             <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No strong emphasis signals detected</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-6">This lecture may have been evenly distributed across topics. Use Key Points and Practice Prompts to revise effectively.</p>
                                <Button variant="outline">Generate practice prompts</Button>
                             </div>
                         )}
                    </div>

                    {/* Footer Safety Line */}
                    <div className="border-t pt-6 text-center">
                        <p className="text-gray-400 text-sm">Revision is about mastery. These insights help you focus on what was taught — not “guess” the exam.</p>
                    </div>

                    {/* ORIGINAL EXAM PROMPTS (If available and no signals, maybe show them? Or just hide for now to declutter) */}
                </div>
            )}
             {/* OTHER TABS */}
             {activeTab === 'glossary' && notes.glossary?.map((item, i) => <div key={i} className="flex mb-2"><dt className="font-bold w-1/3">{item.term}</dt><dd>{item.definition}</dd></div>)}
             {activeTab === 'hooks' && notes.engagement_hooks?.map((h, i)=> <div key={i} className="p-3 bg-purple-50 mb-2 border-l-4 border-purple-400">{h}</div>)}
             {activeTab === 'discussion' && notes.discussion_topics?.map((h, i)=> <li key={i} className="mb-2">{h}</li>)}

          </div>
        </div>
      )}
      



      {/* Transcript Logic (kept same) */}
      {lecture.transcript && (
        <div className="bg-white rounded-xl border border-gray-200 mt-6">
           <button onClick={() => setShowTranscript(!showTranscript)} className="w-full flex justify-between p-4 font-bold text-gray-700 hover:bg-gray-50">
             <span>Full Transcript</span>{showTranscript ? <ChevronUp/> : <ChevronDown/>}
           </button>
           {showTranscript && <div className="p-4 border-t h-96 overflow-y-auto whitespace-pre-wrap text-sm">{lecture.transcript}</div>}
        </div>
      )}

      {/* EMBEDDED CHAT WIDGET */}
      <div className="mt-8">
          <LectureChatWidget lectureId={lecture.id} title={lecture.title} />
      </div>

    </div>
  );
}

