// src/components/awy/DailyCallModal.tsx
// Embedded video call modal using Daily.co prebuilt iframe

'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface DailyCallModalProps {
  roomUrl: string;
  callId: string;
  callerName?: string;
  onHangup: () => void;
}

export default function DailyCallModal({ 
  roomUrl, 
  callId, 
  callerName = 'Connected',
  onHangup 
}: DailyCallModalProps) {
  const [isEnding, setIsEnding] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      await fetch('/api/awy/call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId })
      });
    } catch (err) {
      console.error('[DailyCallModal] End call error:', err);
    }

    onHangup();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white font-medium">{callerName}</span>
            <span className="text-white/60 text-sm">{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Daily.co iframe */}
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          title="Video Call"
        />

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 px-6 py-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            disabled={isEnding}
            className="flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full shadow-lg transition-all hover:scale-105"
            title="End Call"
          >
            <PhoneOff size={28} />
          </button>
        </div>

        {/* Close fallback */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
