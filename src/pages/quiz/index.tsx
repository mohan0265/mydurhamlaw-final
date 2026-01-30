import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
const NextImage = Image;
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { generateSEOTags } from "@/lib/seo";
import {
  Brain,
  History,
  Plus,
  Play,
  Trash2,
  Loader2,
  AlertCircle,
  MessageSquare,
  Mic,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { QuizMeSetupPanel } from "@/components/quiz/QuizMeSetupPanel";
import toast from "react-hot-toast";
import { useFamiliarity } from "@/hooks/useFamiliarity";
import ClarityCard, { ClarityNudge } from "@/components/ui/ClarityCard";

interface QuizSession {
  id: string;
  created_at: string;
  quiz_type: string;
  target_id: string;
  module_code: string;
  status: string;
  target_title?: string;
}

export default function QuizHub() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [isAutoLaunching, setIsAutoLaunching] = useState(false);
  const {
    familiarity,
    loading: familiarityLoading,
    markAsFamiliar,
  } = useFamiliarity();
  const [showFamiliarityGuidance, setShowFamiliarityGuidance] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  // Handle Direct Launch / Resume from Lecture Page
  useEffect(() => {
    if (!router.isReady || !user) return;
    const { id: target_id, scope, mode, title } = router.query;

    if (target_id && scope && mode) {
      handleAutoLaunch(
        target_id as string,
        scope as string,
        mode as "text" | "voice",
        title as string,
      );
    }
  }, [router.isReady, user, router.query]);

  const handleAutoLaunch = async (
    target_id: string,
    scope: string,
    mode: "text" | "voice",
    title?: string,
  ) => {
    setIsAutoLaunching(true);
    try {
      // 1. Check for existing active session for this target
      const { data: existing, error: fetchError } = await supabase
        .from("quiz_sessions")
        .select("id")
        .eq("user_id", user?.id)
        .eq("target_id", target_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        toast.success("Resuming your session...");
        router.push(`/quiz/${existing.id}`);
        return;
      }

      // 2. Otherwise create new
      const { data: session, error: sessionError } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: user?.id,
          quiz_type: scope,
          target_id: target_id,
          status: "active",
          performance_metadata: {
            mode: mode,
            quiz_style: "quick",
            target_title: title || "New Session",
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      toast.success("Starting new session...");
      router.push(`/quiz/${session.id}`);
    } catch (err: any) {
      console.error("Auto-launch failed:", err);
      setIsAutoLaunching(false); // Drop back to Hub if failed
      if (err.code !== "PGRST116") {
        // Not "not found"
        toast.error("Couldn't launch session directly");
      }
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      toast.error("Could not load recent sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      const { error } = await supabase
        .from("quiz_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  const seo = generateSEOTags({
    title: "Quiz Hub - Speak Law with Durmah",
    description:
      "The central engine for Durham Law students to practice speaking and thinking law.",
    canonical: "/quiz",
  });

  if ((!user || isAutoLaunching) && !loading) {
    if (!user) {
      router.push("/login");
      return null;
    }
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-200 blur-3xl opacity-30 rounded-full animate-pulse" />
          <Brain className="w-16 h-16 text-purple-600 relative z-10 animate-float" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Preparing your session...
          </h2>
          <p className="text-gray-500 font-medium">
            Durmah is grounding the reasoning from your lecture.
          </p>
        </div>
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin mt-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFE]">
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Head>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero / Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-widest mb-6 border border-purple-100">
              <Brain className="w-3.5 h-3.5" />
              Durmah Reasoning Engine
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Master the Craft of <br />
              <span className="text-purple-600 italic">Speaking Law.</span>
              <span className="ml-4 inline-block transform -translate-y-4">
                <ClarityNudge
                  label="How this works"
                  onClick={() => setShowFamiliarityGuidance(true)}
                />
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
              Practise articulation, test your reasoning, and get
              professor-level feedback grounded in your Durham syllabus.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="bg-purple-600 text-white font-black py-4 px-10 rounded-2xl flex items-center justify-center gap-3 hover:bg-purple-700 transition shadow-xl shadow-purple-200 active:scale-95 mx-auto md:mx-0"
            >
              <Plus className="w-6 h-6" />
              Start New Quiz
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-purple-200 blur-[100px] opacity-20 rounded-full"></div>
            <NextImage
              src="/images/quiz-me-professor.png"
              alt="Durham Law Quiz Me – Barrister Professor"
              width={320}
              height={320}
              className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 drop-shadow-xl"
              priority={true}
              sizes="(max-width: 768px) 160px, 320px"
            />
          </div>
        </div>

        {(showFamiliarityGuidance ||
          (!familiarity.quiz_me && !familiarityLoading)) && (
          <ClarityCard
            title="Active Recall: Quiz Me"
            description="Don't just read law—speak it. Quiz Me uses your syllabus and lecture transcripts to build real-time oral legal reasoning skills."
            steps={[
              "Choose a Module or a specific Lecture.",
              "Select 'Voice Mode' for a real-time oral debate.",
              "Answer Durmah's reasoning-based questions.",
              "Get instant feedback on your legal articulation.",
            ]}
            onDismiss={() => {
              markAsFamiliar("quiz_me");
              setShowFamiliarityGuidance(false);
            }}
            watchDemoHref="/demo/quiz-me"
          />
        )}

        {/* content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            {/* Setup Modal/Section */}
            {showSetup && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] border-2 border-purple-100 p-8 shadow-2xl relative">
                  <button
                    onClick={() => setShowSetup(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <QuizMeSetupPanel onCancel={() => setShowSetup(false)} />
                </div>
              </div>
            )}

            {/* Empty State / Welcome */}
            {!showSetup && sessions.length === 0 && !loading && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Your first tutorial awaits
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Select a lecture or a module, and Durmah will challenge your
                  legal reasoning with grounded scenarios.
                </p>
              </div>
            )}

            {/* History Section */}
            {sessions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <History className="w-6 h-6 text-purple-600" />
                    Recent Sessions
                  </h2>
                </div>

                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer"
                      onClick={() => router.push(`/quiz/${session.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
                          {session.quiz_type === "lecture" ? (
                            <Play className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Brain className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                            {session.quiz_type === "lecture"
                              ? "Lecture Quiz"
                              : "Module Mastery"}
                          </h3>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            {session.module_code}{" "}
                            {session.target_title
                              ? `• ${session.target_title}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-auto md:ml-0">
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(session.created_at).toLocaleDateString(
                            "en-GB",
                            { timeZone: "Europe/London" },
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-2.5 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Grounded Reasoning</h3>
                <p className="text-indigo-100/80 text-sm leading-relaxed mb-6">
                  Durmah only quizzes you on concepts explicitly found in your
                  Durham syllabus and lecture transcripts. Zero hallucinations.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Syllabus Verified
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Lecture Aligned
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Reference Provenance
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white opacity-5 rounded-full"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Speak Law Mode</h3>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed uppercase tracking-widest font-black">
                Pro Feature
              </p>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                Enable real-time voice debates. Practise articulating arguments
                under pressure for your next seminar.
              </p>
              <button className="w-full py-3 bg-purple-50 text-purple-700 font-bold rounded-xl text-sm hover:bg-purple-100 transition">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
