import React from "react";
import Image from "next/image";
const NextImage = Image;
import { Brain, GraduationCap, Mic, ArrowRight, Zap } from "lucide-react";
import { useRouter } from "next/router";

interface QuizMeCardProps {
  moduleCode?: string;
  lectureId?: string;
  targetTitle?: string;
  className?: string;
  onStart?: (mode: "text" | "voice") => void;
}

export const QuizMeCard: React.FC<QuizMeCardProps> = ({
  moduleCode,
  lectureId,
  targetTitle,
  className = "",
  onStart,
}) => {
  const router = useRouter();

  const handleLaunchQuiz = (mode: "text" | "voice") => {
    if (onStart) {
      onStart(mode);
      return;
    }

    const query: any = { mode };

    if (lectureId) {
      query.scope = "lecture";
      query.id = lectureId;
      if (targetTitle) query.title = targetTitle;
    } else if (moduleCode) {
      query.scope = "module";
      query.id = moduleCode;
      if (targetTitle) query.title = targetTitle;
    }

    router.push({
      pathname: "/quiz",
      query,
    });
  };

  return (
    <div
      className={`overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-purple-800 to-indigo-900 shadow-2xl border border-white/10 text-white relative group transition-all hover:shadow-purple-500/20 ${className}`}
    >
      <div className="relative z-10 p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
            <img
              src="/images/durmah_barrister.png"
              alt="Barrister"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-200/80">
            Active Retrieval
          </span>
        </div>

        <div className="max-w-[70%]">
          <h3 className="text-3xl sm:text-4xl font-black mb-4 leading-[1.1] tracking-tight">
            Quiz Me <br />
            <span className="text-purple-300">Speak Law.</span>
          </h3>
          <p className="text-indigo-100/80 mb-10 text-lg font-medium leading-relaxed">
            Practise explaining {lectureId ? "this lecture" : "this module"}{" "}
            aloud. Durmah will test your reasoning with strictly grounded
            questions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleLaunchQuiz("text")}
            className="flex-1 bg-white text-indigo-950 font-black py-4 px-8 rounded-[1.25rem] flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95 group/btn"
          >
            Start Text Quiz
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleLaunchQuiz("voice")}
            className="flex-1 bg-indigo-500/20 border border-white/20 backdrop-blur-xl text-white font-black py-4 px-8 rounded-[1.25rem] flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95 group/voice"
          >
            <Mic className="w-5 h-5 text-purple-300 group-hover/voice:scale-110 transition-transform" />
            Voice Mode
            <Zap className="w-4 h-4 text-yellow-400 ml-1" />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs font-bold text-white/50">
          <div className="flex -space-x-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-indigo-500/30 border-2 border-indigo-900 flex items-center justify-center backdrop-blur-sm"
              >
                <span className="text-[10px] text-purple-200">★</span>
              </div>
            ))}
          </div>
          <span className="uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Grounded in Durham DB
          </span>
        </div>
      </div>
    </div>
  );
};
