
// Feature flags utility for MyDurhamLaw Termstart 2025
interface FeatureFlags {
  ff_ai_chat: boolean;
  ff_spaced_rep: boolean;
  ff_assignment_oscola: boolean;
  ff_wellbeing_trends: boolean;
  ff_peer_rooms: boolean;
}

const defaultFlags: FeatureFlags = {
  ff_ai_chat: true,           // ✅ Keep true (already working)
  ff_spaced_rep: true,       // 🔄 Change to false (not ready yet)
  ff_assignment_oscola: true, // 🔄 Change to false (not ready yet)  
  ff_wellbeing_trends: true,  // ✅ Keep true (ready for release)
  ff_peer_rooms: true,       // ✅ Keep false (not ready yet)
};

// Parse flags from environment
function parseFlags(flagString?: string): FeatureFlags {
  if (!flagString) return defaultFlags;
  
  const parsed = { ...defaultFlags };
  const pairs = flagString.split(',');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value && key.trim() in parsed) {
      parsed[key.trim() as keyof FeatureFlags] = value.trim() === 'true';
    }
  });
  
  return parsed;
}

// Get flags from environment
export const getFlags = (): FeatureFlags => {
  // Check both VITE_FLAGS and fallback to Next.js env vars
  const viteFlags = typeof window !== 'undefined' 
    ? (window as any).__ENV__?.VITE_FLAGS 
    : process.env.VITE_FLAGS;
    
  return parseFlags(viteFlags);
};

// Individual flag checkers
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const flags = getFlags();
  return flags[flag];
};

// Convenience exports
export const flags = getFlags();

export default flags;
