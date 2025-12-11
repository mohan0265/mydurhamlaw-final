import { useState, useRef, useCallback, useEffect } from "react";
// import { DURMAH_VOICE_PRESETS, getDurmahPresetById } from "@/config/durmahVoicePresets";

export type VoiceTurn = { speaker: "user" | "durmah"; text: string };

interface UseDurmahRealtimeProps {
  systemPrompt: string;
  voice?: string; // Gemini voice name, e.g. "charon"
  onTurn?: (turn: VoiceTurn) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useDurmahRealtime({
  systemPrompt,
  voice = "charon",
  onTurn,
  audioRef,
}: UseDurmahRealtimeProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking" | "previewing" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const startListening = useCallback(async () => {
    console.debug("[DurmahVoice] startListening (Gemini) called");
    try {
      setError(null);
      setStatus("connecting");

      // 1. Create PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.debug(`[DurmahVoice] ICE connection state: ${pc.iceConnectionState}`);
      };

      // 2. Add local microphone
      console.debug("[DurmahVoice] Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 3. Play remote audio
      pc.ontrack = (e) => {
        console.debug("[DurmahVoice] Received remote track");
        const remoteStream = e.streams[0] || new MediaStream([e.track]);
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          audioRef.current.play().catch(err => console.error("Audio play failed:", err));
        }
      };

      // 4. Create Data Channel (Gemini accepts data channel for inputs/events)
      const dc = pc.createDataChannel("gemini-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.debug("[DurmahVoice] Data channel open.");
        setStatus("listening");

        // Send initial setup
        const setupMsg = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
               speech_config: {
                 voice_config: {
                   prebuilt_voice_config: {
                     voice_name: voice // e.g. "charon"
                   }
                 }
               }
            },
            system_instruction: {
              parts: [{ text: systemPrompt }]
            }
          }
        };
        dc.send(JSON.stringify(setupMsg));
      };

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          if (msg.serverContent?.modelTurn?.parts) {
             const textPart = msg.serverContent.modelTurn.parts.find((p: any) => p.text);
             if (textPart) {
               onTurn?.({ speaker: "durmah", text: textPart.text });
             }
          }
          
        } catch (err) {
          // console.error("Error parsing data channel message", err);
        }
      };

      // 5. SDP Offer/Answer Exchange
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      console.debug(`[DurmahVoice] Sending SDP to /api/voice/offer...`);
      
      const response = await fetch("/api/voice/offer", {
        method: "POST",
        body: JSON.stringify({ offerSdp: offer.sdp }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) {
           throw new Error("Voice service endpoint not found (404). Please try again later.");
        }
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Voice service error (${response.status}): ${errorText}`);
      }

      const answerSdp = await response.text();
      // Basic validation that it looks like SDP
      if (!answerSdp || !answerSdp.includes("v=")) {
         throw new Error("Invalid response from voice service");
      }

      console.debug("[DurmahVoice] Received SDP answer.");
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.debug("[DurmahVoice] Call connected.");

    } catch (err: any) {
      console.error("Start call failed:", err);
      setError(err.message || "Failed to start call");
      setStatus("error");
      stopListening();
    }
  }, [systemPrompt, onTurn, voice, stopListening]);

  const stopListening = useCallback(() => {
    console.debug("[DurmahVoice] stopListening called");
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setStatus("idle");
    setSpeaking(false);
  }, []);

  // --- PREVIEW HELPER ---
  const playVoicePreview = useCallback(async (preset: { geminiVoice: string; previewText: string }) => {
    // This helper creates a *separate* temporary connection just for the preview
    // to avoid interfering with the main session state if it was cleaner.
    
    if (!preset) return;

    try {
      console.debug(`[VoicePreview] Starting preview...`);
      const pc = new RTCPeerConnection();
      
      // We need a temporary audio element for preview if the main one is busy,
      // or we can reuse `audioRef` if we aren't in a call.
      // Ideally, create a new Audio element in memory.
      const audioEl = new Audio();
      audioEl.autoplay = true;
      
      pc.ontrack = (e) => {
         const remoteStream = e.streams[0] || new MediaStream([e.track]);
         audioEl.srcObject = remoteStream;
      };
      
      // We don't necessarily need mic for preview if we just send text?
      // Actually Gemini Realtime usually expects a mic stream or it might close/fail?
      // Let's attach a dummy stream or just a silent track if possible.
      // Or just ask user for mic permission briefly.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach(t => pc.addTrack(t, stream));

      const dc = pc.createDataChannel("gemini-preview");
      
      dc.onopen = () => {
         // Setup with the specific voice
         const setupMsg = {
           setup: {
             model: "models/gemini-2.0-flash-exp",
             generation_config: { speech_config: { voice_config: { prebuilt_voice_config: { voice_name: preset.geminiVoice } } } },
           }
         };
         dc.send(JSON.stringify(setupMsg));

         // Send the preview text as a user message
         setTimeout(() => {
             const promptMsg = {
                 client_content: {
                     turns: [{ role: "user", parts: [{ text: `Say exactly this phrase with emotion: "${preset.previewText}"` }] }],
                     turn_complete: true
                 }
             };
             dc.send(JSON.stringify(promptMsg));
         }, 500); // Small delay to ensure setup is processed
      };

      dc.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.serverContent?.turnComplete) {
              // Automatically disconnect after response
              setTimeout(() => {
                  pc.close();
                  stream.getTracks().forEach(t => t.stop());
              }, 4000); // Give it a moment to finish playing
          }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      
      const sdpResponse = await fetch("/api/voice/offer", {
        method: "POST",
        body: JSON.stringify({ offerSdp: offer.sdp }),
        headers: { "Content-Type": "application/json" },
      });
      
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (e) {
      console.error("[VoicePreview] Failed:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { 
    startListening, 
    stopListening, 
    isListening: status !== "idle" && status !== "error", 
    status,
    speaking, 
    error,
    playVoicePreview // Exported helper
  };
}
