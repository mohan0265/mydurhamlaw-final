
'use client';

import React from 'react';
import { User, Tag, Clock, Star, Calendar, MessageCircle } from 'lucide-react';

interface PeerProfile {
  user_id: string;
  display_name: string;
  bio?: string;
  tags: string[];
  availability: Record<string, any>;
  goals: string[];
  year: string;
  score: number;
  is_public: boolean;
  last_active: string;
}

interface Props {
  profile: PeerProfile;
  onConnect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  isConnected?: boolean;
  isPending?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export default function PeerProfileCard({ 
  profile, 
  onConnect, 
  onMessage,
  isConnected = false,
  isPending = false,
  showActions = true,
  compact = false
}: Props) {
  const getLastActiveText = (lastActive: string) => {
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffInHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Active now';
    } else if (diffInHours < 24) {
      return `Active ${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Active ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  const getYearLabel = (year: string) => {
    switch (year) {
      case 'year1':
        return '1st Year';
      case 'year2':
        return '2nd Year';
      case 'year3':
        return '3rd Year';
      default:
        return year;
    }
  };

  const getAvailabilityStatus = (availability: Record<string, any>) => {
    // Simple availability check - you can make this more sophisticated
    const isAvailable = availability?.status === 'available' || 
                       availability?.study_sessions === true;
    return isAvailable;
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 truncate">
                {profile.display_name || 'Anonymous Student'}
              </h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getYearLabel(profile.year)}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="text-xs text-gray-500">
                {getLastActiveText(profile.last_active)}
              </div>
              {profile.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {profile.tags.slice(0, 2).join(', ')}
                    {profile.tags.length > 2 && ` +${profile.tags.length - 2}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <button
                  onClick={() => onMessage?.(profile.user_id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Send message"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => onConnect?.(profile.user_id)}
                  disabled={isPending}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    isPending 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {isPending ? 'Pending' : 'Connect'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {profile.display_name || 'Anonymous Student'}
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getYearLabel(profile.year)}
            </span>
            {profile.score > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">{profile.score.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{getLastActiveText(profile.last_active)}</span>
            </div>
            {getAvailabilityStatus(profile.availability) && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Available for study</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mb-4">
          <p className="text-gray-700 text-sm">{profile.bio}</p>
        </div>
      )}

      {/* Interest Tags */}
      {profile.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Interests</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {profile.goals.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Study Goals</span>
          </div>
          <ul className="space-y-1">
            {profile.goals.slice(0, 3).map((goal, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>{goal}</span>
              </li>
            ))}
            {profile.goals.length > 3 && (
              <li className="text-xs text-gray-500">
                +{profile.goals.length - 3} more goals
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          {isConnected ? (
            <>
              <button
                onClick={() => onMessage?.(profile.user_id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message</span>
              </button>
              <div className="text-sm text-green-600 font-medium">Connected</div>
            </>
          ) : (
            <button
              onClick={() => onConnect?.(profile.user_id)}
              disabled={isPending}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isPending 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>{isPending ? 'Connection Pending' : 'Send Connection Request'}</span>
            </button>
          )}
        </div>
      )}

      {/* Availability Details (if available) */}
      {profile.availability && Object.keys(profile.availability).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {getAvailabilityStatus(profile.availability) ? (
              <span className="text-green-600">Available for study sessions</span>
            ) : (
              <span>Availability varies</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
