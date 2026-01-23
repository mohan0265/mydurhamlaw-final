import React from 'react';
import { Brain, GraduationCap, Mic, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/router';

interface QuizMeCardProps {
  moduleCode?: string;
  lectureId?: string;
  className?: string;
}

export const QuizMeCard: React.FC<QuizMeCardProps> = ({ 
  moduleCode, 
  lectureId,
  className = "" 
}) => {
  const router = useRouter();

  const handleLaunchQuiz = (mode: 'text' | 'voice') => {
    const query: any = { mode };
    if (moduleCode) query.module = moduleCode;
    if (lectureId) query.lecture = lectureId;
    
    router.push({
      pathname: '/study/quiz',
      query
    });
  };

  return (
    <div className={`overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl border border-white/20 text-white relative ${className}`}>
      {/* Decorative Bunny Asset (Visual Placeholder) */}
      <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
        <GraduationCap className="w-32 h-32 rotate-12" />
      </div>

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-purple-200">Durmah Skill</span>
        </div>

        <h3 className="text-3xl font-extrabold mb-3 leading-tight">Quiz Me <span className="text-white/60">on this {lectureId ? 'Lecture' : 'Module'}</span></h3>
        <p className="text-purple-100/90 mb-8 max-w-sm leading-relaxed">
          Practise explaining concepts aloud or through text. Durmah will act as your tutor, testing your reasoning with strictly grounded questions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => handleLaunchQuiz('text')}
            className="flex-1 bg-white text-purple-900 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-lg shadow-black/10 group"
          >
            Start Text Quiz
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleLaunchQuiz('voice')}
            className="flex-1 bg-purple-500/30 border border-white/30 backdrop-blur-md text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition group"
          >
            <Mic className="w-4 h-4 text-purple-200" />
            Voice Quiz
            <Zap className="w-4 h-4 text-yellow-300 ml-1" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-purple-200/60 font-medium">
           <div className="flex -space-x-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full bg-purple-400 border border-purple-700 flex items-center justify-center">
                  <span className="text-[8px] text-white">★</span>
                </div>
              ))}
           </div>
           <span>Grounded in Durham academic content</span>
        </div>
      </div>
    </div>
  );
};
