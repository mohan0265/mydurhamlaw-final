import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { GraduationCap, ArrowRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface YearSelectionPromptProps {
  onYearSelected: (year: string) => void;
  userId: string;
}

const YearSelectionPrompt: React.FC<YearSelectionPromptProps> = ({ onYearSelected, userId }) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const yearOptions = [
    {
      value: 'foundation',
      title: 'Foundation Year',
      description: 'Introduction to legal studies and foundational skills',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      value: 'year1',
      title: 'Year 1',
      description: 'Core legal principles and fundamental modules',
      color: 'from-blue-400 to-blue-600'
    },
    {
      value: 'year2',
      title: 'Year 2',
      description: 'Advanced legal concepts and specialized areas',
      color: 'from-purple-400 to-purple-600'
    },
    {
      value: 'year3',
      title: 'Year 3',
      description: 'Final year with dissertation and optional modules',
      color: 'from-green-400 to-green-600'
    }
  ];

  const handleUpdateYear = async () => {
    if (!selectedYear) return;

    try {
      setIsUpdating(true);

      // Use API route to update the user's profile
      const response = await fetch('/api/profile/update-year', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error updating user year:', data.error);
        return;
      }

      // Call the callback to update the parent component
      onYearSelected(selectedYear);
    } catch (error) {
      console.error('Failed to update year:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              {/* <GraduationCap className="w-6 h-6" /> */}
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">Select Your Academic Year</CardTitle>
          <p className="text-gray-600 mt-2">
            Choose your current year of study to see personalized modules and content
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {yearOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedYear(option.value)}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                  selectedYear === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white text-xl font-bold mb-4`}>
                  {option.value === 'foundation' ? 'F' : option.value.slice(-1)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 text-sm">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleUpdateYear}
              disabled={!selectedYear || isUpdating}
              className="flex items-center gap-2 px-8 py-3 text-lg"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Continue
                  {/* <ArrowRight className="w-4 h-4" /> */}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearSelectionPrompt;