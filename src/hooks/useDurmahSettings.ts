import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  DURMAH_VOICE_PRESETS,
  getDurmahPresetById,
  getDefaultDurmahVoiceId,
} from "@/config/durmahVoicePresets";
import { DELIVERY_STYLES } from "@/lib/voiceCatalog";
import toast from "react-hot-toast";

export function useDurmahSettings() {
  const { user } = useAuth();
  const [voiceId, setVoiceId] = useState<string>(getDefaultDurmahVoiceId());
  const [deliveryStyleId, setDeliveryStyleId] =
    useState<string>("friendly_buddy");
  const [speed, setSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  const lastFetchedUserId = useRef<string | null>(null);

  // Fetch initial setting
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetch for same user
    if (lastFetchedUserId.current === user.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        console.log("[useDurmahSettings] Fetching settings for:", user.id);

        // CREATE A TIMEOUT PROMISE (8 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Fetch settings timed out")), 8000),
        );

        // RACE SUPABASE FETCH vs TIMEOUT
        const { data, error } = (await Promise.race([
          supabase
            .from("user_voice_settings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          timeoutPromise.then(() => ({
            data: null,
            error: { message: "Timeout" },
          })),
        ])) as any;

        if (error) throw error;

        if (isMounted && data) {
          setVoiceId(data.voice_id || getDefaultDurmahVoiceId());
          setDeliveryStyleId(data.delivery_style || "friendly_buddy");
          setSpeed(data.speed || 1.0);
          lastFetchedUserId.current = user.id;
        }
      } catch (err: any) {
        // FAIL-SAFE: Use defaults on ANY error or timeout
        // Silently fail for known non-critical error codes (like table not created yet)
        if (err.code !== "42P01") {
          console.error(
            "[DurmahSettings] Failed/Timed out fetching voice settings:",
            err,
          );
        }
        // Ensure state is at least valid defaults (already set by useState initial)
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const updateSettings = useCallback(
    async (updates: {
      voiceId?: string;
      deliveryStyleId?: string;
      speed?: number;
    }) => {
      // Optimistic update
      if (updates.voiceId) setVoiceId(updates.voiceId);
      if (updates.deliveryStyleId) setDeliveryStyleId(updates.deliveryStyleId);
      if (updates.speed !== undefined) setSpeed(updates.speed);

      if (!user?.id) return;

      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Supabase not initialized");

        const { error } = await supabase.from("user_voice_settings").upsert({
          user_id: user.id,
          voice_id: updates.voiceId || voiceId,
          delivery_style: updates.deliveryStyleId || deliveryStyleId,
          speed: updates.speed !== undefined ? updates.speed : speed,
        });

        if (error) throw error;
        // toast.success('Settings updated'); // Optional, might be too noisy
      } catch (err) {
        console.error("[DurmahSettings] Failed to update settings:", err);
        toast.error("Failed to save preferences");
      }
    },
    [user?.id, voiceId, deliveryStyleId, speed],
  );

  const deliveryStyle =
    DELIVERY_STYLES.find((s) => s.id === deliveryStyleId) || DELIVERY_STYLES[0];

  return {
    voiceId,
    preset: getDurmahPresetById(voiceId),
    deliveryStyleId,
    deliveryStyle,
    speed,
    updateSettings,
    loading,
    availablePresets: DURMAH_VOICE_PRESETS,
  };
}
