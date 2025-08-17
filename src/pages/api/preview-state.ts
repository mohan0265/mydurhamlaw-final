import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionAndProfile } from '@/lib/auth/getUserProfile';
import { sanitizeYear, type YearKey } from '@/lib/academic/preview';

interface PreviewState {
  realYear: YearKey;
  effectiveYear: YearKey;
  isPreview: boolean;
  inTrial: boolean;
  canPreview: boolean;
  trialDaysRemaining: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreviewState | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session, profile, error } = await getSessionAndProfile();

    if (error || !session || !profile) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const realYear = profile.academic_year;
    const previewParam = req.query.previewYear as string;
    const previewYear = sanitizeYear(previewParam);

    const now = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    const inTrial = now <= trialEnd;
    const canPreview = profile.can_preview_years && inTrial;

    const effectiveYear = (previewYear && canPreview) ? previewYear : realYear;
    const isPreview = effectiveYear !== realYear;

    // Calculate days remaining
    const diffTime = trialEnd.getTime() - now.getTime();
    const trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const previewState: PreviewState = {
      realYear,
      effectiveYear,
      isPreview,
      inTrial,
      canPreview,
      trialDaysRemaining
    };

    res.status(200).json(previewState);
  } catch (error) {
    console.error('Preview state error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}