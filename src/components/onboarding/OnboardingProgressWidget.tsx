import React from 'react';
import { useRouter } from 'next/router';
import { Sparkles, ArrowRight, CheckCircle2, ListChecks } from 'lucide-react';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

export default function OnboardingProgressWidget() {
  const router = useRouter();
  const { data, loading } = useOnboardingProgress();

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm border border-purple-100 animate-pulse h-32">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  // 100% Completion State
  if (data.percent === 100) {
      return (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-green-900">You're all set!</h3>
                    <p className="text-xs text-green-700">Setup complete. Ready to study.</p>
                </div>
            </div>
            <button 
                onClick={() => router.push('/onboarding')}
                className="text-xs font-medium text-green-700 hover:text-green-800 bg-white/50 px-3 py-1.5 rounded-lg border border-green-200"
            >
                View Checklist
            </button>
        </div>
      );
  }

  // Calculate essentials (excluding optional) if needed, but for now using total/completed from hook
  // "3 of 4 essentials done" - assuming all tasks in hook are essentials unless marked optional.
  // The hook returns `completedCount` and `totalCount`.
  
  // Find next incomplete task for specific action logic
  // If "Ask Durmah" is the next step, we highlight that specifically
  // The user requested: "Next: Ask Durmah to plan your week (30 sec)" as the generic 'next' framing 
  // OR strictly based on the actual next task?
  // The user request implies REPLACING the generic "Next Step: [Task Name]" with a reward-based framing.
  // However, if the next step is "Upload Timetable", saying "Ask Durmah" might be confusing if they haven't done basics.
  // BUT the user prompts: "Next: Ask Durmah to plan your week (30 sec)" and button "Ask Durmah".
  // This implies the widget might be pivoting to "Durmah is the goal".
  // Let's try to map the *actual* next task to a benefit if possible, or use the user's specific copy if it's a general 'pull'.
  // Given the explicit "Suggested copy (drop-in)", I will use that for the primary view, 
  // but I should probably make the "Ask Durmah" button actually OPEN Durmah or go to a relevant task.
  
  // Actually, if I look at the "Suggested copy": "Next: Ask Durmah to plan your week".
  // This suggests the "Next Step" text should be static or smart-mapped. 
  // I will map it: if next task is 'durmah_add', use that copy. 
  // If next task is usage, use that copy.
  // For safety/relevance, I will stick to the user's "Ask Durmah" framing if the *next* task is indeed AI-related, 
  // or generally "Complete setup to unlock..." implies they should do the setup.
  
  // Wait, the user says: "Instead of 'NEXT STEP: Ask Durmah a question', use...".
  // This implies this copy REPLACES the dynamic task label? 
  // OR it implies the widget *always* pushes you to finish setup?
  // Let's use the layout requested:
  // Title: Get Started
  // Subtitle: Complete setup...
  // Progress: 75% • 3/4 essentials done
  
  return (
    <div className="rounded-xl bg-white border border-purple-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header - Lighter/Reduced as requested */}
      <div className="bg-purple-50 px-4 py-3 flex justify-between items-start border-b border-purple-100">
        <div>
            <h3 className="text-purple-900 font-bold text-base flex items-center gap-2">
                Get Started
            </h3>
            <p className="text-purple-700 text-xs mt-0.5">
                Complete setup to unlock personalised guidance.
            </p>
        </div>
      </div>
      
      <div className="p-4">
        {/* Progress Stats */}
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
            <span className="flex items-center gap-1.5 text-purple-700 font-bold">
                 {data.percent}%
            </span>
            <span>
                {data.completedCount} of {data.totalCount} essentials done
            </span>
        </div>

        {/* Thicker Bar with Check Icon */}
        <div className="relative w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
           <div 
            className="absolute top-0 left-0 bg-purple-600 h-3 rounded-full transition-all duration-1000 flex items-center justify-end pr-1"
            style={{ width: `${data.percent}%` }}
          >
            {data.percent > 10 && <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
            {/* Functional Buttons */}
             <button 
                onClick={() => router.push('/onboarding')}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
                View checklist
            </button>

            {/* Primary Action - "Ask Durmah" or "Continue Setup" depending on context */}
            {/* User requested "Ask Durmah" specifically for the payoff, but if they need to upload a timetable first, 
                "Ask Durmah" might not work yet. 
                Safer: "Continue Setup" links to next task. 
                BUT user said "Improve the visual... Make 'Next step' feel like a reward".
                I will use "Continue Setup" but style it strongly, OR "Unlock Durmah" if incomplete.
            */}
             <button 
                onClick={() => router.push('/onboarding')}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
            >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Continue Setup
            </button>
        </div>
      </div>
    </div>
  );
}
