import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CheckCircle2, Circle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { syncOnboardingState, OnboardingState } from "@/lib/onboarding";
import LectureLinkModal from "./LectureLinkModal";

export default function OnboardingBanner() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Load state
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const s = await syncOnboardingState(user.id);
      setState(s);
      setLoading(false);
    }
    load();
  }, [supabase, modalOpen]); // Reload when modal closes to sync state

  const handleDismiss = async () => {
    if (!state) return;
    localStorage.setItem("caseway:onboardingBannerDismissed", "true");
    // Save to DB
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_onboarding")
        .upsert({ user_id: user.id, dismissed: true });
    }
    setState((prev) => (prev ? { ...prev, dismissed: true } : null));
  };

  // If loading, dismissed, or missing state, hide
  // Check localStorage too
  if (loading) return null;
  if (state?.dismissed) return null;
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("caseway:onboardingBannerDismissed")
  )
    return null;

  const allComplete =
    state?.ics_uploaded &&
    state?.module_handbooks_uploaded &&
    state?.lecture_links_set &&
    state?.module_page_screenshot_uploaded;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {allComplete
                ? "Setup complete ✅"
                : "Welcome to CASEWAY — Start Here"}
            </h2>
            <p className="text-slate-600 mb-6 font-medium">
              {allComplete
                ? "You're all set for the term!"
                : "You're all set. Complete these 4 steps to personalize CASEWAY for Durham."}
            </p>
          </div>

          {/* Dismiss Button - Only if complete */}
          {allComplete && (
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <X className="w-4 h-4" />
              Don't show this again
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: ICS */}
          <StepItem
            completed={!!state?.ics_uploaded}
            title="Import your timetable (ICS)"
            desc="Upload your calendar export to fill Year-at-a-Glance automatically."
            cta="Go to YAAG →"
            onClick={() => router.push("/yaag")} // Assuming /yaag exists, or /calendar
          />

          {/* Step 2: Handbooks */}
          <StepItem
            completed={!!state?.module_handbooks_uploaded}
            title="Upload your module handbooks (PDF)"
            desc="Add handbook PDFs so CASEWAY can build your syllabus + assessment map."
            cta="Go to Uploads →"
            onClick={() => router.push("/upload")} // Assuming /upload
          />

          {/* Step 3: Lecture Links */}
          <StepItem
            completed={!!state?.lecture_links_set}
            title="Set your lecture links (Panopto / Echo360)"
            desc="Paste your lecture folder link once for 1-click access all term."
            cta="Set lecture links →"
            onClick={() => setModalOpen(true)}
          />

          {/* Step 4: Screenshot */}
          <StepItem
            completed={!!state?.module_page_screenshot_uploaded}
            title="Upload a screenshot of your university module page"
            desc="A quick screenshot helps match your module names exactly."
            cta="Upload screenshot →"
            onClick={() => router.push("/upload?type=screenshot")} // Preset type
          />
        </div>
      </div>

      <LectureLinkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
}

function StepItem({ completed, title, desc, cta, onClick }: any) {
  return (
    <div
      onClick={completed ? undefined : onClick}
      className={`p-4 rounded-lg border transition-all cursor-pointer group ${
        completed
          ? "bg-slate-50 border-slate-100 opacity-75"
          : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 group-hover:text-purple-500 shrink-0" />
        )}
        <h3
          className={`font-semibold text-sm ${completed ? "text-slate-500 line-through" : "text-slate-900"}`}
        >
          {title}
        </h3>
      </div>

      <p className="text-xs text-slate-500 mb-3 pl-8 leading-relaxed">{desc}</p>

      {!completed && (
        <div className="pl-8">
          <span className="text-xs font-semibold text-purple-600 group-hover:underline">
            {cta}
          </span>
        </div>
      )}
    </div>
  );
}
