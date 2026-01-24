import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
  DURMAH_VOICE_PRESETS, 
  getDurmahPresetById,
  getDefaultDurmahVoiceId 
} from '@/config/durmahVoicePresets';
import { DELIVERY_STYLES } from '@/lib/voiceCatalog';
import toast from 'react-hot-toast';

export function useDurmahSettings() {
  const { user } = useAuth();
  const [voiceId, setVoiceId] = useState<string>(getDefaultDurmahVoiceId());
  const [deliveryStyleId, setDeliveryStyleId] = useState<string>('friendly_buddy');
  const [speed, setSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  // Fetch initial setting
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from('user_voice_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setVoiceId(data.voice_id || getDefaultDurmahVoiceId());
          setDeliveryStyleId(data.delivery_style || 'friendly_buddy');
          setSpeed(data.speed || 1.0);
        }
      } catch (err: any) {
        // Silently fail for known non-critical error codes (like table not created yet)
        if (err.code === '42P01') return; 
        console.error('[DurmahSettings] Failed to fetch voice settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  const updateSettings = useCallback(async (updates: { voiceId?: string; deliveryStyleId?: string; speed?: number }) => {
    // Optimistic update
    if (updates.voiceId) setVoiceId(updates.voiceId);
    if (updates.deliveryStyleId) setDeliveryStyleId(updates.deliveryStyleId);
    if (updates.speed !== undefined) setSpeed(updates.speed);

    if (!user?.id) return;

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not initialized");

      const { error } = await supabase
        .from('user_voice_settings')
        .upsert({ 
          user_id: user.id,
          voice_id: updates.voiceId || voiceId,
          delivery_style: updates.deliveryStyleId || deliveryStyleId,
          speed: updates.speed !== undefined ? updates.speed : speed
        });

      if (error) throw error;
      // toast.success('Settings updated'); // Optional, might be too noisy
    } catch (err) {
      console.error('[DurmahSettings] Failed to update settings:', err);
      toast.error('Failed to save preferences');
    }
  }, [user?.id, voiceId, deliveryStyleId, speed]);

  const deliveryStyle = DELIVERY_STYLES.find(s => s.id === deliveryStyleId) || DELIVERY_STYLES[0];

  return {
    voiceId,
    preset: getDurmahPresetById(voiceId),
    deliveryStyleId,
    deliveryStyle,
    speed,
    updateSettings,
    loading,
    availablePresets: DURMAH_VOICE_PRESETS
  };
}
