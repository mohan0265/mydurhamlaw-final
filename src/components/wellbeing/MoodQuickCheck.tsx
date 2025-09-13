
'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { telemetry } from '@/lib/telemetry';
import { resilientFetch } from '@/lib/resilient-fetch';
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  AlertTriangle,
  CheckCircle,
  X,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MoodEntry {
  score: number;
  stressors: string[];
  note: string;
}

interface Props {
  onMoodSubmit?: (mood: MoodEntry) => void;
  showConsent?: boolean;
}

const MOOD_LEVELS = [
  { score: 1, label: 'Very Poor', icon: '😟', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { score: 2, label: 'Poor', icon: '😕', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { score: 3, label: 'Okay', icon: '😐', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { score: 4, label: 'Good', icon: '🙂', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { score: 5, label: 'Excellent', icon: '😊', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
];

const COMMON_STRESSORS = [
  'Academic workload',
  'Exam stress',
  'Assignment deadlines',
  'Financial concerns',
  'Social pressures',
  'Health issues',
  'Family matters',
  'Career uncertainty',
  'Relationship issues',
  'Sleep problems',
  'Other',
];

export default function MoodQuickCheck({ onMoodSubmit, showConsent = true }: Props) {
  const isEnabled = useFeatureFlag('ff_wellbeing_trends');
  const [hasConsented, setHasConsented] = useState(!showConsent);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedStressors, setSelectedStressors] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<Date | null>(null);

  useEffect(() => {
    // Check if user has already submitted mood today
    const today = new Date().toDateString();
    const lastSubmittedDate = localStorage.getItem('mood_last_submitted');
    
    if (lastSubmittedDate === today) {
      setLastSubmitted(new Date(lastSubmittedDate));
    }
  }, []);

  const handleConsentGiven = () => {
    setHasConsented(true);
    setShowForm(true);
    toast.success('Thank you for participating in wellbeing tracking');
  };

  const handleConsentDeclined = () => {
    toast.info('Wellbeing tracking is optional. You can enable it later in settings.');
  };

  const toggleStressor = (stressor: string) => {
    if (selectedStressors.includes(stressor)) {
      setSelectedStressors(selectedStressors.filter(s => s !== stressor));
    } else {
      setSelectedStressors([...selectedStressors, stressor]);
    }
  };

  const handleSubmit = async () => {
    if (selectedMood === null) {
      toast.error('Please select your mood level');
      return;
    }

    const moodEntry: MoodEntry = {
      score: selectedMood,
      stressors: selectedStressors,
      note: note.trim(),
    };

    try {
      setIsSubmitting(true);

      const response = await resilientFetch('/netlify/functions/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user', // TODO: Get from auth context
        },
        body: JSON.stringify(moodEntry),
        endpoint: 'mood',
      });

      const result = await response.json();

      if (result.success) {
        // Track mood submission
        telemetry.moodSubmit(selectedMood, selectedStressors.length);
        
        // Store last submitted date
        const today = new Date().toDateString();
        localStorage.setItem('mood_last_submitted', today);
        setLastSubmitted(new Date());
        
        // Reset form
        setSelectedMood(null);
        setSelectedStressors([]);
        setNote('');
        setShowForm(false);
        
        toast.success('Mood check completed! Thank you for sharing.');
        onMoodSubmit?.(moodEntry);
      } else {
        throw new Error(result.error || 'Failed to submit mood');
      }
    } catch (error) {
      console.error('Mood submission error:', error);
      toast.error('Failed to submit mood check');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEnabled) {
    return null;
  }

  // Consent gate
  if (!hasConsented && showConsent) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="h-6 w-6 text-pink-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Wellbeing Check-In</h3>
            <p className="text-sm text-gray-600">Optional mood and stress tracking</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Privacy & Data Use</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your wellbeing data is private and secure</li>
                  <li>• Data is used only for your personal trend tracking</li>
                  <li>• You can delete your data at any time</li>
                  <li>• This is completely optional - you can skip this</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleConsentGiven}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Yes, I'd like to track my wellbeing</span>
            </button>
            <button
              onClick={handleConsentDeclined}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
              <span>Skip</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted today
  if (lastSubmitted && !showForm) {
    const todayString = new Date().toDateString();
    const lastSubmittedString = lastSubmitted.toDateString();
    
    if (todayString === lastSubmittedString) {
      return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-pink-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wellbeing Check-In</h3>
              <p className="text-sm text-gray-600">Daily mood tracking</p>
            </div>
          </div>

          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <div className="text-gray-600 mb-2">You've already completed today's mood check</div>
            <div className="text-sm text-gray-500">Come back tomorrow for your next check-in</div>
            
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Submit another entry
            </button>
          </div>
        </div>
      );
    }
  }

  // Main mood check form
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Heart className="h-6 w-6 text-pink-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">How are you feeling today?</h3>
          <p className="text-sm text-gray-600">Quick wellbeing check-in</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall mood today:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LEVELS.map((mood) => (
              <button
                key={mood.score}
                onClick={() => setSelectedMood(mood.score)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedMood === mood.score
                    ? `${mood.bg} ${mood.color} border-current`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{mood.icon}</div>
                <div className="text-xs font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Stressors */}
        {selectedMood && selectedMood <= 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What's contributing to how you feel? (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_STRESSORS.map((stressor) => (
                <button
                  key={stressor}
                  onClick={() => toggleStressor(stressor)}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    selectedStressors.includes(stressor)
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {stressor}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anything else you'd like to note? (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any thoughts about your day, what went well, or what was challenging..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500">
            {note.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={selectedMood === null || isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Complete Check-In</span>
              </>
            )}
          </button>
        </div>

        {/* Support Resources */}
        {selectedMood && selectedMood <= 2 && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Need support?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Durham University Student Support: 0191 334 2000</li>
                  <li>• Samaritans (24/7): 116 123</li>
                  <li>• Student Minds: studentminds.org.uk</li>
                  <li>• Your College Welfare team</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
