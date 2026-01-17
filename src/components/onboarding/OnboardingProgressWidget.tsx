import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  href: string;
  helpDocCategory: string;
}

interface OnboardingStatus {
  ok: boolean;
  percent: number;
  completed: number;
  total: number;
  steps: OnboardingStep[];
}

export default function OnboardingProgressWidget() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/onboarding/status', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OnboardingStatus = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error('[OnboardingProgressWidget] Error fetching status:', err);
      setError(err?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const handleCTAClick = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading your progress...</span>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-100 p-6">
        <div className="text-center text-red-600">
          <p className="font-medium">Unable to load onboarding progress</p>
          <button
            onClick={fetchStatus}
            className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isComplete = status.percent === 100;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg border border-purple-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          Setup Progress
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isComplete ? (
            <span className="text-green-600 font-medium">All set! You're ready to go 🎉</span>
          ) : (
            `Get the most out of MyDurhamLaw by completing these steps`
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status.completed} of {status.total} completed
          </span>
          <span className="text-sm font-bold text-purple-600">
            {status.percent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${status.percent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {status.steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.done
                ? 'bg-green-50 border border-green-200'
                : 'bg-white border border-gray-200 hover:border-purple-300'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.done ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold ${
                step.done ? 'text-green-800' : 'text-gray-800'
              }`}>
                {step.title}
              </h3>
              <p className={`text-xs mt-0.5 ${
                step.done ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.description}
              </p>
            </div>

            {/* CTA Button */}
            {!step.done && (
              <button
                onClick={() => handleCTAClick(step.href)}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              >
                {step.cta}
              </button>
            )}

            {step.done && (
              <div className="flex-shrink-0 px-4 py-2 text-xs font-medium text-green-700">
                ✓ Done
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer - Only show if complete */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-purple-200 text-center">
          <p className="text-sm text-gray-600">
            You're all set! Explore the app and make the most of your Durham Law journey.
          </p>
        </div>
      )}
    </div>
  );
}
