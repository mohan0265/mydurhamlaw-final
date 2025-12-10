import { useState, useRef, useCallback, useEffect } from "react";
import { DURMAH_VOICE_PRESETS } from "@/config/durmahVoicePresets";

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
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

        // Send initial setup if needed (Gemini Multimodal Live)
        // Note: Currently, voice selection is often handled via tool config or initial setup
        // But the exact JSON format for "setup" on the data channel depends on the specific Gemini API version.
        // For now, we rely on the prompt to set the tone, as voice selection might be fixed per model 
        // or require a specific 'setup' payload.
        
        // We attempt to send a setup message with the system prompt/voice if the API supports it
        // The structure below is a best-effort based on Gemini Live API patterns.
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

          if (msg.toolUse) {
            // Handle tools if any
          }
          
        } catch (err) {
          // console.error("Error parsing data channel message", err);
        }
      };

      // 5. SDP Offer/Answer Exchange via our proxy
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      console.debug(`[DurmahVoice] Sending SDP to /api/voice/offer...`);
      
      const sdpResponse = await fetch("/api/voice/offer", {
        method: "POST",
        body: JSON.stringify({ offerSdp: offer.sdp }),
        headers: { "Content-Type": "application/json" },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP negotiation failed: ${sdpResponse.statusText}`);
      }

      const answerSdp = await sdpResponse.text();
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
  }, [systemPrompt, onTurn, voice]);

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
    speaking, // Note: Gemini WebRTC doesn't send explicit "speaking" events easily without VAD analysis, so this might be static or inferred
    error 
  };
}
