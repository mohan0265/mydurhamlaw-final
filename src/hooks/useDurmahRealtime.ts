import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceTurn = { speaker: "user" | "durmah"; text: string };

type UseDurmahRealtimeOptions = {
  systemPrompt: string;
  onTurn?: (turn: VoiceTurn) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
};

export function useDurmahRealtime({ systemPrompt, onTurn, audioRef }: UseDurmahRealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCall = useCallback(async () => {
    console.debug("[DurmahVoice] Starting call...");
    try {
      setError(null);

      // 1. Get ephemeral token
      console.debug("[DurmahVoice] Fetching token from /realtime-session...");
      const tokenRes = await fetch("/.netlify/functions/realtime-session", {
        method: "POST",
      });
      if (!tokenRes.ok) {
        throw new Error(`Failed to get token: ${tokenRes.statusText}`);
      }
      const data = await tokenRes.json();
      const ephemeralKey = data.client_secret.value;
      console.debug("[DurmahVoice] Token received.");

      // 2. Create PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Add local microphone
      console.debug("[DurmahVoice] Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.debug(`[DurmahVoice] Microphone obtained. Tracks: ${stream.getAudioTracks().length}`);
      
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.debug("[DurmahVoice] Added audio track to PC");
      });

      // 4. Play remote audio
      pc.ontrack = (e) => {
        console.debug("[DurmahVoice] Received remote track");
        const remoteStream = e.streams[0] || new MediaStream([e.track]);
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          audioRef.current.play().catch(err => console.error("Audio play failed:", err));
        }
      };

      // 5. Data Channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.debug("[DurmahVoice] Data channel open. Sending session update...");
        // Send initial system instructions
        const updateEvent = {
          type: "session.update",
          session: {
            model: "gpt-4o-realtime-preview-2024-12-17",
            instructions: systemPrompt,
            modalities: ["text", "audio"],
            input_audio_transcription: {
              model: "whisper-1",
            },
            turn_detection: {
              type: "server_vad",
            },
          },
        };
        dc.send(JSON.stringify(updateEvent));
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          
          // Log interesting events (filter out frequent audio deltas if needed)
          if (!event.type.includes("delta") && !event.type.includes("buffer")) {
             console.debug("[DurmahVoice] Event:", event.type);
          }

          // Handle transcriptions
          if (event.type === "conversation.item.input_audio_transcription.completed") {
             console.debug("[DurmahVoice] User transcript:", event.transcript);
             onTurn?.({ speaker: "user", text: event.transcript });
          }
          if (event.type === "response.audio_transcript.done") {
             console.debug("[DurmahVoice] Agent transcript:", event.transcript);
             onTurn?.({ speaker: "durmah", text: event.transcript });
          }

          // Handle speaking state
          if (event.type === "response.content_part.added" && event.part?.type === "audio") {
             setSpeaking(true);
          }
          if (event.type === "response.done") {
             setSpeaking(false);
          }
          
          // Error handling from server
          if (event.type === "error") {
            console.error("[DurmahVoice] Server error:", event.error);
          }
        } catch (err) {
          console.error("Error parsing data channel message", err);
        }
      };

      // 6. SDP Offer/Answer
      console.debug("[DurmahVoice] Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      console.debug(`[DurmahVoice] Sending SDP to OpenAI (${model})...`);
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP error: ${sdpResponse.statusText}`);
      }

      const answerSdp = await sdpResponse.text();
      console.debug("[DurmahVoice] Received SDP answer. Setting remote description...");
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setConnected(true);
      console.debug("[DurmahVoice] Call connected.");

    } catch (err: any) {
      console.error("Start call failed:", err);
      setError(err.message || "Failed to start call");
      endCall();
    }
  }, [systemPrompt, onTurn]);

  const endCall = useCallback(() => {
    console.debug("[DurmahVoice] Ending call...");
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
    // Audio ref is managed by parent component, just clear srcObject if needed
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setConnected(false);
    setSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return { connected, speaking, error, startCall, endCall };
}
