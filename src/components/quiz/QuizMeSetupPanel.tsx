import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Mic, 
  MessageSquare, 
  FileAudio, 
  BookOpen, 
  FileText, 
  Target, 
  ArrowRight, 
  ChevronRight, 
  Lock,
  Zap,
  Loader2,
  Clock,
  Brain
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import toast from 'react-hot-toast';

interface QuizMeSetupPanelProps {
  onCancel: () => void;
}

export const QuizMeSetupPanel: React.FC<QuizMeSetupPanelProps> = ({ onCancel }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false); // Default to false, check via user meta or plan

  // Form State
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [scope, setScope] = useState<'lecture' | 'assignment' | 'module'>('module');
  const [style, setStyle] = useState<'quick' | 'irac' | 'hypo' | 'counter'>('quick');
  const [selection, setSelection] = useState<{ id: string, title: string, code?: string } | null>(null);

  // Data State
  const [modules, setModules] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    // Check if Pro (Mocked for now, integrate with your real useAuth)
    // setIsPro(user?.user_metadata?.plan === 'pro');
    
    // Auto-prefill from query if coming from deep link
    if (router.query.scope && router.query.id) {
       setScope(router.query.scope as any);
       // Select item logic would go here after fetching
    }
    
    fetchSetupData();
  }, [user, router.query]);

  const fetchSetupData = async () => {
    const supabase = getSupabaseClient();
    try {
      // 1. Fetch User Modules
      const { data: userModules } = await supabase
        .from('profiles')
        .select('modules')
        .eq('id', user?.id)
        .single();
      
      if (userModules?.modules) {
        setModules(userModules.modules.map((m: string) => ({ id: m, title: m, code: m })));
      }

      // 2. Fetch Recent Lectures
      const { data: recentLectures } = await supabase
        .from('lectures')
        .select('id, title, module_code')
        .order('created_at', { ascending: false })
        .limit(10);
      setLectures(recentLectures || []);

      // 3. Fetch Assignments
      const { data: userAssignments } = await supabase
        .from('assignments')
        .select('id, title, module_code')
        .order('due_date', { ascending: true })
        .limit(10);
      setAssignments(userAssignments || []);
      
    } catch (err) {
      console.error('Failed to fetch setup data', err);
    }
  };

  const handleStart = async () => {
    if (!selection && scope !== 'module') {
      toast.error('Please select a specific target');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    
    try {
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: user?.id,
          module_code: selection?.code || selection?.id || null,
          quiz_type: scope,
          target_id: scope !== 'module' ? selection?.id : null,
          status: 'active',
          performance_metadata: {
            mode: mode,
            quiz_style: style,
            target_title: selection?.title || null
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      router.push(`/quiz/${session.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Stepper Header */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-1 bg-gray-100 rounded-full ${step > s ? 'bg-purple-200' : ''}`} />}
          </div>
        ))}
        <div className="ml-auto text-xs font-black uppercase tracking-widest text-gray-400">
           Step {step} of 3
        </div>
      </div>

      <div className="min-h-[400px]">
        {/* Step 1: Mode */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black text-gray-900 mb-2">How should we practice?</h2>
            <p className="text-gray-500 mb-8 font-medium italic">Choose your interface mode.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setMode('text')}
                className={`p-10 rounded-[2rem] border-2 text-left transition-all ${mode === 'text' ? 'border-purple-600 bg-purple-50/50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                <div className="p-3 bg-white shadow-sm rounded-2xl w-fit mb-6">
                  <MessageSquare className={`w-8 h-8 ${mode === 'text' ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Text Mode</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Refine your thoughts and draft legal arguments at your own pace.</p>
              </button>

              <button 
                onClick={() => setMode('voice')}
                className={`p-10 rounded-[2rem] border-2 text-left transition-all relative group ${mode === 'voice' ? 'border-purple-600 bg-purple-50/50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                {!isPro && <div className="absolute top-6 right-6 p-2 bg-yellow-400 rounded-lg text-white"><Lock className="w-4 h-4" /></div>}
                <div className="p-3 bg-white shadow-sm rounded-2xl w-fit mb-6">
                  <Mic className={`w-8 h-8 ${mode === 'voice' ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  Voice Mode 
                  <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Build seminar confidence with real-time oral debates. <span className="text-purple-600">Pro Feature.</span></p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Scope */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black text-gray-900 mb-2">What is the focus?</h2>
            <p className="text-gray-500 mb-8 font-medium italic">Select your grounding context.</p>

            <div className="flex flex-wrap gap-2 mb-8">
               {[
                 { id: 'module', label: 'Module Outcomes', icon: BookOpen },
                 { id: 'lecture', label: 'Specific Lecture', icon: FileAudio },
                 { id: 'assignment', label: 'Assignment Brief', icon: FileText },
                 { id: 'week', label: 'This Week (YAAG)', icon: Clock }
               ].map(s => (
                 <button 
                   key={s.id}
                   onClick={() => { setScope(s.id as any); setSelection(null); }}
                   className={`px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all border-2 ${scope === s.id ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                 >
                   <s.icon className="w-4 h-4" />
                   {s.label}
                 </button>
               ))}
            </div>

            {/* Selection Area */}
            <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 p-2 max-h-64 overflow-y-auto">
              {scope === 'module' && modules.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setSelection(m)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selection?.id === m.id ? 'bg-white shadow-md text-purple-700 font-bold' : 'hover:bg-white/50 text-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    {m.code}
                  </div>
                  {selection?.id === m.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
              
              {scope === 'lecture' && lectures.map(l => (
                <button 
                  key={l.id} 
                  onClick={() => setSelection(l)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selection?.id === l.id ? 'bg-white shadow-md text-purple-700 font-bold' : 'hover:bg-white/50 text-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 w-12">{l.module_code}</span>
                    <span className="truncate">{l.title}</span>
                  </div>
                  {selection?.id === l.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}

              {scope === 'assignment' && assignments.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => setSelection(a)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selection?.id === a.id ? 'bg-white shadow-md text-purple-700 font-bold' : 'hover:bg-white/50 text-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 w-12">{a.module_code}</span>
                    <span className="truncate">{a.title}</span>
                  </div>
                  {selection?.id === a.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}

              {scope === 'week' && (
                <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                   Fetching current term context from YAAG...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Style */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Select your challenge.</h2>
            <p className="text-gray-500 mb-8 font-medium italic">What level of reasoning should Durmah test?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[
                 { id: 'quick', label: 'Quick Checks', desc: 'Core definitions and key principles.', icon: Zap, pro: false },
                 { id: 'irac', label: 'IRAC Mini', desc: 'Identify issues and apply rules in structured 2-3 step scenarios.', icon: Target, pro: false },
                 { id: 'hypo', label: 'Hypothetical App', desc: 'Deep-dive into complex factual scenarios with mixed precedents.', icon: Brain, pro: false },
                 { id: 'counter', label: 'Counter & Rebut', desc: 'Durmah takes a hostile legal position. Defend yours.', icon: Mic, pro: true }
               ].map(s => (
                 <button 
                   key={s.id}
                   onClick={() => setStyle(s.id as any)}
                   className={`p-6 rounded-3xl border-2 text-left transition-all relative group ${style === s.id ? 'border-purple-600 bg-purple-50/50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                 >
                   {s.pro && !isPro && <Lock className="absolute top-4 right-4 w-4 h-4 text-gray-300" />}
                   <div className="flex items-center gap-4 mb-3">
                      <div className={`p-2 rounded-xl ${style === s.id ? 'bg-white' : 'bg-gray-50'}`}>
                         <s.icon className={`w-5 h-5 ${style === s.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <h3 className="font-bold text-gray-900">{s.label}</h3>
                   </div>
                   <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                 </button>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
        <button 
           onClick={() => step === 1 ? onCancel() : setStep(prev => prev - 1)}
           className="text-sm font-bold text-gray-400 hover:text-gray-600 px-4"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        
        <button 
           onClick={() => step < 3 ? setStep(prev => prev + 1) : handleStart()}
           disabled={loading}
           className="bg-gray-900 text-white font-black py-4 px-10 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {step < 3 ? 'Next Step' : 'Launch Session'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
