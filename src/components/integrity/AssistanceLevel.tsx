import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Users, Settings } from 'lucide-react';
import { HELP_LEVEL_COPY, type HelpLevel } from '@/lib/integrity/humanMode';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

interface AssistanceLevelProps {
  value: HelpLevel;
  onChange: (level: HelpLevel) => void;
  className?: string;
  compact?: boolean;
}

const AssistanceLevel: React.FC<AssistanceLevelProps> = ({
  value,
  onChange,
  className = '',
  compact = false
}) => {
  const { user, userProfile } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load default from profile
  useEffect(() => {
    if (userProfile?.ai_help_default && userProfile.ai_help_default !== value) {
      onChange(userProfile.ai_help_default as HelpLevel);
    }
  }, [userProfile, value, onChange]);

  const handleLevelChange = async (level: HelpLevel) => {
    onChange(level);
    
    // Save as default preference if user is logged in
    if (user) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase
            .from('profiles')
            .update({ ai_help_default: level })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error saving assistance level preference:', error);
      }
    }
  };

  const getLevelIcon = (level: HelpLevel) => {
    switch (level) {
      case 'L1_SELF':
        return <Brain className="w-4 h-4" />;
      case 'L2_GUIDED':
        return <BookOpen className="w-4 h-4" />;
      case 'L3_COACH':
        return <Users className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: HelpLevel, isActive: boolean) => {
    const baseColors = {
      L1_SELF: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
      L2_GUIDED: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      L3_COACH: isActive ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    };
    return baseColors[level];
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${getLevelColor(value, true)}`}
          >
            {getLevelIcon(value)}
            <span>{HELP_LEVEL_COPY[value].label.split(' · ')[1]}</span>
            <Settings className="w-3 h-3" />
          </button>
          
          {isSettingsOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
              <h4 className="font-medium text-gray-900 mb-3">AI Assistance Level</h4>
              <div className="space-y-2">
                {(Object.keys(HELP_LEVEL_COPY) as HelpLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      handleLevelChange(level);
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      value === level 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getLevelIcon(level)}
                      <div>
                        <div className="font-medium text-gray-900">{HELP_LEVEL_COPY[level].label}</div>
                        <div className="text-sm text-gray-600">{HELP_LEVEL_COPY[level].desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">AI Assistance Level</h3>
        <div className="text-xs text-gray-500">Saved as default</div>
      </div>
      
      <div className="space-y-3">
        {(Object.keys(HELP_LEVEL_COPY) as HelpLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => handleLevelChange(level)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              value === level 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getLevelColor(level, value === level)}`}>
                {getLevelIcon(level)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {HELP_LEVEL_COPY[level].label}
                </div>
                <div className="text-sm text-gray-600">
                  {HELP_LEVEL_COPY[level].desc}
                </div>
              </div>
              {value === level && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Your assistance level determines how much guidance the AI provides while ensuring you do your own work.
        </p>
      </div>
    </div>
  );
};

export default AssistanceLevel;