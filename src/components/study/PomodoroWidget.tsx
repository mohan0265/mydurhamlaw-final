
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { telemetry } from '@/lib/telemetry';
import { resilientFetch } from '@/lib/resilient-fetch';
import { Play, Pause, Square, Clock, Tag, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface Session {
  topic: string;
  duration: number;
  tags: string[];
  difficulty?: number;
  notes?: string;
}

interface Props {
  onSessionComplete?: (session: Session) => void;
}

export default function PomodoroWidget({ onSessionComplete }: Props) {
  const isEnabled = useFeatureFlag('ff_spaced_rep');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [duration, setDuration] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notifications
    audioRef.current = new Audio('/notification.mp3'); // Add a notification sound file
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((time) => {
          if (time === 0) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play notification sound
    audioRef.current?.play().catch(console.error);

    if (isBreak) {
      // Break completed
      toast.success('Break time over! Ready to focus?');
      setIsBreak(false);
      setTime(duration * 60);
    } else {
      // Pomodoro session completed
      const sessionData = {
        topic: topic || 'Study Session',
        duration,
        tags,
        difficulty: undefined,
        notes: undefined,
      };

      handleSessionEnd(sessionData);
      setSessions(prev => prev + 1);
      
      // Start break
      if (sessions > 0 && sessions % 4 === 3) {
        // Long break every 4 sessions
        toast.success('Long break time! (15 minutes)');
        setTime(15 * 60);
        setIsBreak(true);
      } else {
        // Short break
        toast.success('Break time!');
        setTime(breakTime * 60);
        setIsBreak(true);
      }
    }
  };

  const startTimer = () => {
    if (!isActive && !isBreak) {
      setStartTime(new Date());
      telemetry.pomodoroStart(duration, topic || 'General');
    }
    
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const stopTimer = () => {
    if (isActive && !isBreak && startTime) {
      const actualDuration = Math.round((Date.now() - startTime.getTime()) / 60000);
      const sessionData = {
        topic: topic || 'Study Session',
        duration: actualDuration,
        tags,
        difficulty: undefined,
        notes: undefined,
      };
      
      handleSessionEnd(sessionData, false);
    }
    
    setIsActive(false);
    setIsPaused(false);
    setTime(duration * 60);
    setStartTime(null);
  };

  const handleSessionEnd = async (sessionData: Session, completed = true) => {
    try {
      telemetry.pomodoroEnd(sessionData.duration, completed, sessionData.topic);

      // Save to backend
      await resilientFetch('/netlify/functions/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user', // TODO: Get from auth context
        },
        body: JSON.stringify({
          topic: sessionData.topic,
          duration_min: sessionData.duration,
          started_at: startTime?.toISOString(),
          ended_at: new Date().toISOString(),
          difficulty: sessionData.difficulty,
          notes: sessionData.notes,
          tags: sessionData.tags,
        }),
        endpoint: 'session',
        showErrorToast: false,
      });

      onSessionComplete?.(sessionData);
      
      if (completed) {
        toast.success(`${sessionData.duration} minute study session completed!`);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Session completed but failed to save. Please try again.');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {isBreak ? 'Break Time' : 'Study Session'}
          </h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Timer Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={duration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setDuration(newDuration);
                  if (!isActive) {
                    setTime(newDuration * 60);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isActive}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={breakTime}
                onChange={(e) => setBreakTime(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isActive}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-mono font-bold mb-2 ${
          isBreak ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatTime(time)}
        </div>
        <div className="text-sm text-gray-600">
          {isBreak ? 'Take a break!' : `Session ${sessions + 1}`}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isActive ? (
          <button
            onClick={startTimer}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isBreak 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>Start</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={startTimer}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  isBreak 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={stopTimer}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>

      {/* Session Details */}
      {!isBreak && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What are you studying?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Contract Law, Tort, Constitutional Law"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isActive}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isActive}
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim() || isActive}
                className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Stats */}
      {sessions > 0 && (
        <div className="mt-6 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-800">
            <strong>Today's Sessions:</strong> {sessions}
          </div>
        </div>
      )}
    </div>
  );
}
