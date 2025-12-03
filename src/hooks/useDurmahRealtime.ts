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
    try {
      setError(null);

      // 1. Get ephemeral token
      const tokenRes = await fetch("/.netlify/functions/openai-realtime-token", {
        method: "POST",
      });
      if (!tokenRes.ok) {
        throw new Error(`Failed to get token: ${tokenRes.statusText}`);
      }
      const data = await tokenRes.json();
      const ephemeralKey = data.client_secret.value;

      // 2. Create PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Play remote audio
      pc.ontrack = (e) => {
        const stream = e.streams[0] || new MediaStream([e.track]);
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch(err => console.error("Audio play failed:", err));
        }
      };

      // 3. Add local microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Data Channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        // Send initial system instructions
        const updateEvent = {
          type: "session.update",
          session: {
            instructions: systemPrompt,
            modalities: ["text", "audio"],
            input_audio_transcription: {
              model: "whisper-1",
            },
          },
        };
        dc.send(JSON.stringify(updateEvent));
        
        // Kick off response if needed, or wait for user. 
        // Usually better to wait or send a "response.create" if we want the model to speak first.
        // For Durmah, let's wait for user or send a greeting if desired.
        // User prompt implies "Start a single Realtime session... Open the mic".
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          
          // Handle transcriptions
          if (event.type === "conversation.item.input_audio_transcription.completed") {
             onTurn?.({ speaker: "user", text: event.transcript });
          }
          if (event.type === "response.audio_transcript.done") {
             onTurn?.({ speaker: "durmah", text: event.transcript });
          }

          // Handle speaking state
          if (event.type === "response.content_part.added" && event.part?.type === "audio") {
             setSpeaking(true);
          }
          if (event.type === "response.done") {
             setSpeaking(false);
          }
        } catch (err) {
          console.error("Error parsing data channel message", err);
        }
      };

      // 5. SDP Offer/Answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
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
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setConnected(true);

    } catch (err: any) {
      console.error("Start call failed:", err);
      setError(err.message || "Failed to start call");
      endCall();
    }
  }, [systemPrompt, onTurn]);

  const endCall = useCallback(() => {
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
