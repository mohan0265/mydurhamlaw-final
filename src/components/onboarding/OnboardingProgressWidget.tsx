import React from 'react';
import { useRouter } from 'next/router';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

export default function OnboardingProgressWidget() {
  const router = useRouter();
  const { data, loading } = useOnboardingProgress();

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm border border-purple-100 animate-pulse h-24">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  // Don't show if 100%? User didn't say to hide, but "summary banner" implies it disappears or changes state.
  // If 100%, maybe show "All set!" green banner.
  if (data.percent === 100) {
      return (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-green-900">You're all set!</h3>
                    <p className="text-xs text-green-700">Onboarding complete.</p>
                </div>
            </div>
            <button 
                onClick={() => router.push('/onboarding')}
                className="text-xs font-medium text-green-700 hover:text-green-800"
            >
                View Hub
            </button>
        </div>
      );
  }

  // Find next incomplete task
  const nextTask = data.tasks.find(t => !t.completed);

  return (
    <div className="rounded-xl bg-white border border-purple-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-medium text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Setup Progress
        </h3>
        <span className="text-white text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
            {data.percent}%
        </span>
      </div>
      
      <div className="p-4">
        {/* Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div 
            className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${data.percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Next Step</span>
                <span className="text-sm font-medium text-gray-900 line-clamp-1">
                    {nextTask ? nextTask.label : 'Finalizing...'}
                </span>
            </div>
            
            <button 
                onClick={() => router.push('/onboarding')}
                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-2 rounded-lg transition-colors"
            >
                Continue <ArrowRight className="w-3 h-3" />
            </button>
        </div>
      </div>
    </div>
  );
}
