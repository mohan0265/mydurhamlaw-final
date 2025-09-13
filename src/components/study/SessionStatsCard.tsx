
'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { resilientFetch } from '@/lib/resilient-fetch';
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';

interface SessionStats {
  total_minutes: number;
  session_count: number;
  avg_session_length: number;
  current_streak: number;
  period: string;
}

interface Props {
  userId?: string;
  period?: '1d' | '7d' | '30d';
}

export default function SessionStatsCard({ userId, period = '7d' }: Props) {
  const isEnabled = useFeatureFlag('ff_spaced_rep');
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEnabled) {
      fetchStats();
    }
  }, [isEnabled, period, userId]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await resilientFetch(
        `/netlify/functions/session?period=${period}&limit=50`,
        {
          headers: {
            'x-user-id': userId || 'current-user', // TODO: Get from auth context
          },
          endpoint: 'session-stats',
          showErrorToast: false,
        }
      );

      const data = await response.json();
      
      if (data.success && data.aggregates) {
        setStats(data.aggregates);
      } else {
        setError('Failed to load session statistics');
      }
    } catch (error) {
      console.error('Failed to fetch session stats:', error);
      setError('Unable to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '1d':
        return 'Today';
      case '7d':
        return 'This Week';
      case '30d':
        return 'This Month';
      default:
        return 'This Week';
    }
  };

  if (!isEnabled) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Study Statistics</h3>
        </div>
        <div className="text-center py-4">
          <div className="text-gray-500 mb-2">Unable to load statistics</div>
          <button
            onClick={fetchStats}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Study Statistics</h3>
        </div>
        <span className="text-sm text-gray-500">{getPeriodLabel(period)}</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Total Study Time */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium text-gray-600">Total Time</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(stats.total_minutes)}
            </div>
          </div>

          {/* Session Count */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-gray-600">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.session_count}
            </div>
          </div>

          {/* Current Streak */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm font-medium text-gray-600">Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.current_streak} {stats.current_streak === 1 ? 'day' : 'days'}
            </div>
          </div>

          {/* Average Session Length */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm font-medium text-gray-600">Avg Session</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(stats.avg_session_length)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <div className="text-gray-600 mb-2">No study sessions yet</div>
          <div className="text-sm text-gray-500">
            Start a Pomodoro session to begin tracking your study time!
          </div>
        </div>
      )}

      {/* Motivational Messages */}
      {stats && stats.total_minutes > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            {stats.current_streak === 0 ? (
              <span>🔥 Start a study session today to begin your streak!</span>
            ) : stats.current_streak === 1 ? (
              <span>🔥 Great start! Keep it up to build your streak!</span>
            ) : stats.current_streak < 7 ? (
              <span>🔥 {stats.current_streak} day streak! You're building a great habit!</span>
            ) : stats.current_streak < 30 ? (
              <span>🚀 Amazing {stats.current_streak} day streak! You're on fire!</span>
            ) : (
              <span>🏆 Incredible {stats.current_streak} day streak! You're unstoppable!</span>
            )}
          </div>
          {stats.total_minutes >= 120 && (
            <div className="text-xs text-blue-600 mt-1">
              You've studied for {formatDuration(stats.total_minutes)} this {period === '1d' ? 'day' : period === '7d' ? 'week' : 'month'}. 
              Excellent dedication! 📚
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {stats && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={fetchStats}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Stats
          </button>
        </div>
      )}
    </div>
  );
}
