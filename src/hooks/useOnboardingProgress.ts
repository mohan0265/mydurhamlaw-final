import { useState, useEffect } from 'react';


export interface OnboardingTask {
  task_key: string;
  label: string;
  description: string;
  href: string;
  optional: boolean;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface OnboardingProgress {
  percent: number;
  completedCount: number;
  totalCount: number;
  tasks: OnboardingTask[];
}

export function useOnboardingProgress() {
  const [data, setData] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      // We use the API route because it handles the complex auto-detection logic
      // running on the server side (which is safer and faster for DB queries).
      const res = await fetch('/api/onboarding/progress');
      if (!res.ok) throw new Error('Failed to fetch progress');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Onboarding hook error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return { data, loading, error, refresh: fetchProgress };
}
