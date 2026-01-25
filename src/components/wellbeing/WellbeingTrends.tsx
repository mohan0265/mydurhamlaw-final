
'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { resilientFetch } from '@/lib/resilient-fetch';
import { TrendingUp, Calendar, Heart, AlertTriangle } from 'lucide-react';

interface MoodData {
  date: string;
  avg_score: number | null;
  entry_count: number;
  stressors: string[];
}

interface MoodStats {
  total_entries: number;
  avg_mood: number | null;
  period_days: number;
  common_stressors: Array<{ stressor: string; count: number }>;
}

interface Props {
  userId?: string;
  period?: number;
}

export default function WellbeingTrends({ userId, period = 14 }: Props) {
  const isEnabled = useFeatureFlag('ff_wellbeing_trends');
  const [trendData, setTrendData] = useState<MoodData[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEnabled) {
      fetchMoodTrends();
    }
  }, [isEnabled, period, userId]);

  useEffect(() => {
    const fetchSummaryStats = async () => {
      try {
        const res = await fetch('/api/wellbeing/summary');
        if (res.ok) {
          const data = await res.json();
          // Simple averaging logic for display
          if (data.history && data.history.length > 0) {
            const history = data.history;
            const avgMood = history.reduce((acc: number, curr: any) => acc + curr.mood, 0) / history.length;
            const avgStress = history.reduce((acc: number, curr: any) => acc + curr.stress, 0) / history.length;
            
            setStats(prevStats => ({
              ...(prevStats || {} as MoodStats), // Preserve existing stats if any
              avgMood: Number(avgMood.toFixed(1)),
              avgStress: Number(avgStress.toFixed(1)),
              entriesCount: data.count
            }));
            
            // Map last 7 entries for sparklines if needed (simplified here)
            // For now just using averages as per UI
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        // This isLoading is for the main trend data, not this summary fetch
        // If a separate loading state is needed for summary, it should be added.
      }
    };
    
    if (isEnabled) {
      fetchSummaryStats();
    }
  }, [isEnabled]);

  const fetchMoodTrends = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await resilientFetch(
        `/netlify/functions/mood?days=${period}`,
        {
          headers: {
            'x-user-id': userId || 'current-user', // TODO: Get from auth context
          },
          endpoint: 'mood-trends',
          showErrorToast: false,
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setTrendData(data.trend || []);
        setStats(data.stats || null);
      } else {
        setError('Failed to load wellbeing data');
      }
    } catch (error) {
      console.error('Failed to fetch mood trends:', error);
      setError('Unable to load wellbeing trends');
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = (score: number | null) => {
    if (score === null) return '⚫';
    if (score <= 1.5) return '😟';
    if (score <= 2.5) return '😕';
    if (score <= 3.5) return '😐';
    if (score <= 4.5) return '🙂';
    return '😊';
  };

  const getMoodColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score <= 1.5) return 'bg-red-400';
    if (score <= 2.5) return 'bg-orange-400';
    if (score <= 3.5) return 'bg-yellow-400';
    if (score <= 4.5) return 'bg-green-400';
    return 'bg-blue-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { timeZone: 'Europe/London',  
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getInsights = () => {
    if (!stats || !trendData.length) return [];

    const insights = [];
    const recentEntries = trendData.filter(d => d.entry_count > 0).slice(-7);
    
    if (recentEntries.length >= 3) {
      const recentAvg = recentEntries.reduce((sum, d) => sum + (d.avg_score || 0), 0) / recentEntries.length;
      const earlierEntries = trendData.filter(d => d.entry_count > 0).slice(0, -7);
      
      if (earlierEntries.length >= 3) {
        const earlierAvg = earlierEntries.reduce((sum, d) => sum + (d.avg_score || 0), 0) / earlierEntries.length;
        const improvement = recentAvg - earlierAvg;
        
        if (improvement > 0.5) {
          insights.push({
            type: 'positive',
            message: 'Your mood has been improving recently! 📈',
          });
        } else if (improvement < -0.5) {
          insights.push({
            type: 'concern',
            message: 'Your mood seems to have dipped lately. Consider reaching out for support if needed.',
          });
        }
      }
    }

    const entriesThisWeek = trendData.slice(-7).filter(d => d.entry_count > 0).length;
    if (entriesThisWeek >= 5) {
      insights.push({
        type: 'positive',
        message: 'Great job staying consistent with mood tracking! 🎯',
      });
    }

    if (stats.common_stressors.length > 0) {
      const topStressor = stats.common_stressors[0];
      if (topStressor && topStressor.count >= 3) {
        insights.push({
          type: 'info',
          message: `"${topStressor.stressor}" has been a recurring stressor. Consider strategies to address this.`,
        });
      }
    }

    return insights;
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <div className="text-gray-600">Wellbeing trends not available</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">Wellbeing Trends</h3>
        </div>
        <div className="text-center py-4">
          <div className="text-gray-500 mb-2">Unable to load wellbeing data</div>
          <button
            onClick={fetchMoodTrends}
            className="text-pink-600 hover:text-pink-800 text-sm font-medium"
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
          <TrendingUp className="h-5 w-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">Wellbeing Trends</h3>
        </div>
        <span className="text-sm text-gray-500">Last {period} days</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-full"></div>
          <div className="animate-pulse h-20 bg-gray-200 rounded w-full"></div>
          <div className="animate-pulse h-16 bg-gray-200 rounded w-full"></div>
        </div>
      ) : trendData.length === 0 || !stats ? (
        <div className="text-center py-8">
          <Heart className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <div className="text-gray-600 mb-2">No wellbeing data yet</div>
          <div className="text-sm text-gray-500">
            Complete a mood check-in to start tracking your wellbeing trends
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mood Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Mood</h4>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {trendData.slice(-14).map((day, index) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDate(day.date)}
                  </div>
                  <div 
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-lg ${getMoodColor(day.avg_score)} ${
                      day.entry_count === 0 ? 'opacity-30' : ''
                    }`}
                    title={day.avg_score ? `Average mood: ${day.avg_score.toFixed(1)}` : 'No entry'}
                  >
                    {getMoodEmoji(day.avg_score)}
                  </div>
                  {day.entry_count > 1 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {day.entry_count}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span>Poor</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Okay</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Good</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="text-2xl font-bold text-pink-600">
                {stats.avg_mood ? stats.avg_mood.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-pink-800">Average Mood</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_entries}
              </div>
              <div className="text-sm text-blue-800">Total Entries</div>
            </div>
          </div>

          {/* Common Stressors */}
          {stats.common_stressors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Common Stressors</h4>
              <div className="space-y-2">
                {stats.common_stressors.slice(0, 5).map((stressor, index) => (
                  <div key={stressor.stressor} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{stressor.stressor}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full" 
                          style={{ width: `${(stressor.count / stats.total_entries) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-6">{stressor.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {getInsights().length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Insights</h4>
              <div className="space-y-2">
                {getInsights().map((insight, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border text-sm ${
                      insight.type === 'positive' 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : insight.type === 'concern'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {insight.type === 'concern' && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <span>{insight.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Resources */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Support Resources</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• <strong>Durham Student Support:</strong> 0191 334 2000</div>
              <div>• <strong>College Welfare Team:</strong> Contact through your college</div>
              <div>• <strong>NHS 111:</strong> For urgent mental health support</div>
              <div>• <strong>Samaritans:</strong> 116 123 (free, 24/7)</div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="text-center">
            <button
              onClick={fetchMoodTrends}
              className="text-sm text-pink-600 hover:text-pink-800 font-medium"
            >
              Refresh Trends
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
