// src/components/awy/IncomingCallModal.tsx
// Modal shown to loved one when receiving an incoming call

'use client';

import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

interface IncomingCallModalProps {
  callId: string;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ 
  callId, 
  callerName,
  onAccept,
  onDecline
}: IncomingCallModalProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [ringTime, setRingTime] = useState(0);

  // Ring timer and auto-decline after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRingTime(t => {
        if (t >= 30) {
          // Auto-decline after 30 seconds
          handleDecline();
          return t;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = async () => {
    if (isResponding) return;
    setIsResponding(true);

    try {
      const res = await fetch('/api/awy/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId, action: 'accept' })
      });

      if (res.ok) {
        onAccept();
      } else {
        console.error('[IncomingCall] Accept failed');
        setIsResponding(false);
      }
    } catch (err) {
      console.error('[IncomingCall] Accept error:', err);
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    if (isResponding) return;
    setIsResponding(true);

    try {
      await fetch('/api/awy/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId, action: 'decline' })
      });
    } catch (err) {
      console.error('[IncomingCall] Decline error:', err);
    }

    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">
        {/* Caller Avatar */}
        <div className="relative mx-auto mb-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <User size={48} className="text-white" />
          </div>
          {/* Ringing animation rings */}
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-white/30 animate-ping" />
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
        <p className="text-white/80 mb-8 flex items-center justify-center gap-2">
          <Phone size={16} className="animate-bounce" />
          Incoming video call...
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          {/* Decline */}
          <button
            onClick={handleDecline}
            disabled={isResponding}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-red-400 rounded-full flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110">
              <PhoneOff size={28} />
            </div>
            <span className="text-white/80 text-sm">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={handleAccept}
            disabled={isResponding}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-green-500 hover:bg-green-600 disabled:bg-green-400 rounded-full flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110 animate-pulse">
              <Phone size={28} />
            </div>
            <span className="text-white/80 text-sm">Accept</span>
          </button>
        </div>

        {/* Auto-decline timer */}
        <p className="text-white/50 text-xs mt-6">
          {30 - ringTime > 0 ? `Auto-declining in ${30 - ringTime}s` : 'Timing out...'}
        </p>
      </div>
    </div>
  );
}
