// Feature flag utility to accept both "true" and "1" for enabled flags
export const isEnabled = (value?: string): boolean => value === "true" || value === "1";

// Specific feature flag helpers
export const isAWYEnabled = (): boolean => 
  isEnabled(process.env.NEXT_PUBLIC_ENABLE_AWY) || isEnabled(process.env.NEXT_PUBLIC_FEATURE_AWY);

export const isWellbeingEnabled = (): boolean => 
  isEnabled(process.env.NEXT_PUBLIC_ENABLE_WELLBEING_FEATURES);

export const isAIEnabled = (): boolean => 
  isEnabled(process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES);