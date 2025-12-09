import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  DURMAH_VOICE_PRESETS, 
  DurmahVoiceId, 
  DEFAULT_DURMAH_VOICE_ID,
  getDurmahVoicePreset
} from '@/config/durmahVoicePresets';
import toast from 'react-hot-toast';

export function useDurmahSettings() {
  const { user } = useAuth();
  const [voiceId, setVoiceId] = useState<DurmahVoiceId>(DEFAULT_DURMAH_VOICE_ID);
  const [loading, setLoading] = useState(true);

  // Fetch initial setting
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('durmah_voice_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.durmah_voice_id) {
          // Validate that the ID exists in our presets
          const preset = getDurmahVoicePreset(data.durmah_voice_id);
          setVoiceId(preset.id);
        }
      } catch (err) {
        console.error('[DurmahSettings] Failed to fetch voice setting:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  const updateVoice = useCallback(async (newVoiceId: DurmahVoiceId) => {
    // Optimistic update
    setVoiceId(newVoiceId);

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ durmah_voice_id: newVoiceId })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Voice updated');
    } catch (err) {
      console.error('[DurmahSettings] Failed to update voice:', err);
      toast.error('Failed to save voice preference');
      // Revert on error (optional, but good practice)
      // For now we keep the local state as it's less jarring
    }
  }, [user?.id]);

  return {
    voiceId,
    preset: getDurmahVoicePreset(voiceId),
    updateVoice,
    loading,
    availablePresets: DURMAH_VOICE_PRESETS
  };
}
