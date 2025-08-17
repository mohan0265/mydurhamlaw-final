import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { type YearKey } from '../lib/academic/preview';

interface PreviewState {
  realYear: YearKey;
  effectiveYear: YearKey;
  isPreview: boolean;
  inTrial: boolean;
  canPreview: boolean;
  trialDaysRemaining: number;
}

export function usePreviewState() {
  const router = useRouter();
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviewState = async () => {
      try {
        setLoading(true);
        
        // Include current URL params in the request
        const searchParams = new URLSearchParams();
        if (router.query.previewYear) {
          searchParams.set('previewYear', router.query.previewYear as string);
        }

        const response = await fetch(`/api/preview-state?${searchParams.toString()}`);
        if (response.ok) {
          const state = await response.json();
          setPreviewState(state);
        } else {
          console.error('Failed to fetch preview state:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch preview state:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have query params resolved
    if (router.isReady) {
      fetchPreviewState();
    }
  }, [router.isReady, router.query.previewYear]);

  return { previewState, loading };
}