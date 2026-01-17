import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    CheckCircle2, Circle, ArrowRight, ExternalLink, 
    Calendar, FileText, UserPlus, Users, MessageSquare, 
    LayoutDashboard, HelpCircle, ChevronRight, Info
} from 'lucide-react';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

export default function OnboardingHub() {
  const router = useRouter();
  const { data, loading, refresh } = useOnboardingProgress();
  const [expandedGuide, setExpandedGuide] = React.useState<string | null>(null);

  if (loading) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
      );
  }

  if (!data) return null;

  // Icons mappping
  const getIcon = (key: string) => {
      if (key.includes('timetable')) return <Calendar className="w-5 h-5 text-blue-500" />;
      if (key.includes('assignment')) return <FileText className="w-5 h-5 text-orange-500" />;
      if (key.includes('awy') || key.includes('loved_one')) return <UserPlus className="w-5 h-5 text-pink-500" />;
      if (key.includes('lecture')) return <LayoutDashboard className="w-5 h-5 text-purple-500" />;
      if (key.includes('community')) return <Users className="w-5 h-5 text-green-500" />;
      if (key.includes('lounge')) return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      if (key.includes('durmah')) return <MessageSquare className="w-5 h-5 text-cyan-500" />;
      return <Info className="w-5 h-5 text-gray-500" />;
  };

  // Guide Content
  const getGuideContent = (key: string) => {
      switch(key) {
        case 'connect_timetable':
            return (
                <div className="bg-blue-50 p-4 rounded-lg mt-3 text-sm space-y-3 border border-blue-100">
                    <p className="font-semibold text-blue-900">How to sync your timetable:</p>
                    <ol className="list-decimal pl-5 space-y-2 text-blue-800">
                        <li>Log in to <a href="https://mytimetable.durham.ac.uk" target="_blank" className="underline">MyTimetable Durham</a>.</li>
                        <li>Click "Connect Calendar" or "Subscribe".</li>
                        <li>Copy the <strong>subscription URL</strong> (ends in .ics).</li>
                        <li>Click the button below to go to your Profile settings.</li>
                        <li>Paste the URL into the "Timetable URL" field.</li>
                    </ol>
                    <div className="mt-2">
                        <img src="/images/yaag.png" alt="Timetable Guide" className="rounded-lg border border-blue-200 shadow-sm max-w-full h-auto" />
                    </div>
                </div>
            );
        case 'add_first_assignment':
            return (
                <div className="bg-orange-50 p-4 rounded-lg mt-3 text-sm space-y-3 border border-orange-100">
                    <p className="font-semibold text-orange-900">Tracking assignments:</p>
                    <ol className="list-decimal pl-5 space-y-2 text-orange-800">
                        <li>Go to Blackboard / Ultra and check your module handbooks.</li>
                        <li>Find your deadlines for this term.</li>
                        <li>Click "Go to Assignments" below.</li>
                        <li>Click "New Assignment" and fill in the details (or upload the brief!).</li>
                    </ol>
                    <div className="mt-2">
                        <img src="/images/dashboard.png" alt="Dashboard Guide" className="rounded-lg border border-orange-200 shadow-sm max-w-full h-auto" />
                    </div>
                </div>
            );
        case 'visit_awy':
        case 'setup_awy':
             return (
                <div className="bg-pink-50 p-4 rounded-lg mt-3 text-sm space-y-3 border border-pink-100">
                    <p className="font-semibold text-pink-900">Always With You (AWY):</p>
                    <p className="text-pink-800">Connect with family or friends to share your study status without feeling monitored.</p>
                    <div className="mt-2">
                        <img src="/images/awy.png" alt="AWY Guide" className="rounded-lg border border-pink-200 shadow-sm max-w-full h-auto" />
                    </div>
                </div>
            );
        default:
            return null;
      }
  };

  return (
    <>
      <Head>
        <title>Onboarding Hub - MyDurhamLaw</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Welcome to MyDurhamLaw</h1>
                <p className="mt-2 text-gray-600 max-w-lg mx-auto">
                    Let's get everything set up so Durmah can help you succeed.
                </p>
                
                {/* Visual Progress */}
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-lg font-bold text-gray-900">{data.percent}% Complete</span>
                        <span className="text-sm text-gray-500">{data.completedCount}/{data.totalCount} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                        <div 
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                            style={{ width: `${data.percent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {data.tasks.map((task, index) => {
                    const hasGuide = ['connect_timetable', 'add_first_assignment', 'setup_awy', 'visit_awy'].includes(task.task_key);
                    const isExpanded = expandedGuide === task.task_key;

                    return (
                        <div 
                            key={task.task_key}
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                                task.completed 
                                    ? 'border-gray-200 opacity-90' 
                                    : 'border-purple-200 shadow-md ring-1 ring-purple-100'
                            }`}
                        >
                            <div className="p-5 flex items-start gap-4">
                                {/* Icon / Checkbox */}
                                <div className="mt-1 flex-shrink-0">
                                    {task.completed ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getIcon(task.task_key)}
                                        <h3 className={`text-base font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {task.label}
                                        </h3>
                                        {task.optional && !task.completed && (
                                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-medium">OPTIONAL</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {/* Main Action Button */}
                                        <button 
                                            onClick={() => {
                                                if (task.href) router.push(task.href);
                                            }}
                                            className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                task.completed
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                                            }`}
                                        >
                                            {task.completed ? 'Visit Again' : 'Go to Page'} <ArrowRight className="w-4 h-4" />
                                        </button>

                                        {/* Guide Toggle */}
                                        {hasGuide && !task.completed && (
                                            <button
                                                onClick={() => setExpandedGuide(isExpanded ? null : task.task_key)}
                                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                                {isExpanded ? 'Hide Guide' : 'Show Guide'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded Guide */}
                                    {isExpanded && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            {getGuideContent(task.task_key)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Completion Banner */}
            {data.percent === 100 && (
                <div className="mt-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Sparkles className="w-8 h-8 text-yellow-300" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">You're officially a MyDurhamLaw pro!</h2>
                    <p className="text-green-100 mb-6 max-w-md mx-auto">
                        You've unlocked all the tools you need for academic success. Keep exploring and checking in with Durmah.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg"
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
}
