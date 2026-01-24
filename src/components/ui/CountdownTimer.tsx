'use client';

import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  dueDate: string | Date;
  showSeconds?: boolean;
  className?: string; // Additional classes for the container
  style?: 'minimal' | 'banner'; // Style variant
  suppressTimer?: boolean; // If true, show simple days even if urgent
}

export default function CountdownTimer({ 
  dueDate, 
  showSeconds = false,
  className = "",
  style = 'minimal',
  suppressTimer = false
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUrgent: boolean;
    isOverdue: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const diffMs = due.getTime() - now.getTime();
      
      const days = differenceInDays(due, now);
      const hours = differenceInHours(due, now) % 24;
      const minutes = differenceInMinutes(due, now) % 60;
      const seconds = differenceInSeconds(due, now) % 60;
      
      // Urgent if < 24 hours (0 days)
      const isUrgent = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
      const isOverdue = diffMs < 0;

      setTimeLeft({ days, hours, minutes, seconds, isUrgent, isOverdue });
    };

    calculateTime();
    // Update every second if showing seconds or urgent, otherwise every minute
    const interval = setInterval(calculateTime, showSeconds || (timeLeft?.isUrgent) ? 1000 : 60000);
    
    return () => clearInterval(interval);
  }, [dueDate, showSeconds, timeLeft?.isUrgent]);

  if (!timeLeft) return null; // Hydration gap

  if (timeLeft.isOverdue) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-bold text-red-100 bg-red-900/40 px-3 py-1 rounded-full ${className}`}>
        <Clock size={14} className="animate-pulse" />
        <span>Overdue</span>
      </div>
    );
  }

  // Not urgent OR suppressed: Show Days
  if (!timeLeft.isUrgent || suppressTimer) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-bold ${className}`}>
        {style === 'banner' && <Clock size={16} className="opacity-80" />}
        <span>{timeLeft.days} {timeLeft.days === 1 ? 'day' : 'days'} left</span>
      </div>
    );
  }

  // Urgent: Show Timer (HH:MM[:SS])
  return (
    <div className={`inline-flex items-center gap-2 font-mono font-bold text-orange-200 bg-orange-900/30 px-3 py-1 rounded-full border border-orange-500/30 ${className}`}>
      <Clock size={14} className="text-orange-400 animate-pulse" />
      <span className="tabular-nums tracking-wider text-orange-100">
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m
        {showSeconds && (
          <span className="opacity-80 text-xs ml-0.5"> : {String(timeLeft.seconds).padStart(2, '0')}s</span>
        )}
      </span>
      <span className="text-[10px] uppercase font-bold text-orange-400">Left</span>
    </div>
  );
}
