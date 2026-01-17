import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
// ...
// Inside component or function
const supabase = getSupabaseClient();
import toast from 'react-hot-toast';
import { parseTimetableText, ParsedTimetableEvent } from '@/lib/durham/timetableParser';
import { ArrowRight, Check, Calendar, User, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function ProfileTimetablePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [profile, setProfile] = useState({
    display_name: '',
    year_of_study: 'year1', // DB canonical value
    degree_type: 'LLB',
    modules: '' // stored as text, comma separated locally
  });

  // Step 2: Timetable
  const [timetableText, setTimetableText] = useState('');
  const [parsedEvents, setParsedEvents] = useState<ParsedTimetableEvent[]>([]);

  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.year_of_study) {
      toast.error('Please select your year of study');
      return;
    }
    if (!supabase) {
        toast.error('System error: Database client not available');
        return;
    }

    setSaving(true);
    try {
      const modulesArray = profile.modules.split(',').map(s => s.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          year_of_study: profile.year_of_study, // Already in canonical format
          degree_type: profile.degree_type,
          modules: modulesArray,
          last_profile_updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (error) throw error;
      
      toast.success('Profile saved!');
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleParseTimetable = () => {
    const events = parseTimetableText(timetableText);
    if (events.length === 0) {
      toast('No events found. Check the example format?', { icon: '🤔' });
    } else {
      toast.success(`Found ${events.length} events!`);
    }
    setParsedEvents(events);
  };

  const handleSaveTimetable = async () => {
    setSaving(true);
    if (!supabase) return;

    try {
      // 1. Delete existing pasted events
      await supabase
        .from('timetable_events')
        .delete()
        .eq('user_id', user!.id)
        .eq('source', 'pasted_timetable');

      // 2. Insert new events
      // Need to map day string to actual dates for this week? 
      // Requirement says "Dates: map days of week to the current academic week".
      // For simplicity, we will store them as recurring events or just generic.
      // The DB schema has start_time and end_time as timestamptz.
      // We need to construct a valid date. Let's use the NEXT occurrence of that day.
      
      const rows = parsedEvents.map(evt => {
        const today = new Date();
        const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          .findIndex(d => d.toLowerCase() === evt.day.toLowerCase());
        
        // Find next date with this day index
        const d = new Date();
        if (dayIndex !== -1) {
            d.setDate(today.getDate() + ((dayIndex + 7 - today.getDay()) % 7));
        }
        
        // Set times
        const timePartsStart = evt.startTime.split(':');
        const timePartsEnd = evt.endTime.split(':');

        const startH = parseInt(timePartsStart[0] || '9', 10);
        const startM = parseInt(timePartsStart[1] || '0', 10);
        const endH = parseInt(timePartsEnd[0] || '10', 10);
        const endM = parseInt(timePartsEnd[1] || '0', 10);
        
        const start = new Date(d);
        start.setHours(startH, startM, 0, 0);
        
        const end = new Date(d);
        end.setHours(endH, endM, 0, 0);

        return {
          user_id: user!.id,
          title: evt.title,
          location: evt.location,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          recurrence_pattern: 'weekly',
          source: 'pasted_timetable'
        };
      });

      const { error } = await supabase.from('timetable_events').insert(rows);
      if (error) throw error;

      toast.success('Timetable saved successfully!');

      // FIRE AND FORGET: Onboarding
      fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_key: 'connect_timetable' }),
      }).catch(err => console.warn('[Onboarding] Timetable mark failed', err));

      router.push('/dashboard');
      setTimeout(() => {
        toast('Your Year-at-a-Glance will update shortly.', { icon: '📅', duration: 4000 });
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  // Initial load check
  useEffect(() => {
    if (!user || !supabase) return;

    const loadData = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, year_of_study, degree_type, modules')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile({
            display_name: data.display_name || '',
            year_of_study: data.year_of_study || 'year1', // canonical
            degree_type: data.degree_type || 'LLB',
            modules: Array.isArray(data.modules) ? data.modules.join(', ') : (data.modules || '')
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Setup Profile & Timetable - MyDurhamLaw</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Let's get you set up</h1>
            <p className="mt-2 text-gray-600">Step {step} of 2</p>
            {/* Progress Bar */}
            <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-600 transition-all duration-500 ease-out"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              {step === 1 && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       <User className="text-violet-600"/> Your Profile
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Help us understand where you are in your Durham Law journey.</p>
                  </div>

                  {/* Preferred Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-3 border"
                      value={profile.preferred_name}
                      onChange={e => setProfile({...profile, preferred_name: e.target.value})}
                      placeholder="e.g. Priya"
                    />
                    <p className="mt-1 text-xs text-gray-500">How would you like MyDurhamLaw and Durmah to address you?</p>
                  </div>

                  {/* Year Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year of Study <span className="text-red-500">*</span></label>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Foundation', value: 'foundation' },
                        { label: 'Year 1', value: 'year1' },
                        { label: 'Year 2', value: 'year2' },
                        { label: 'Year 3', value: 'year3' },
                      ].map(({label, value}) => (
                        <div
                          key={value}
                          onClick={() => setProfile({...profile, year_of_study: value})}
                          className={`cursor-pointer text-center py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                            profile.year_of_study === value
                              ? 'bg-violet-50 border-violet-500 text-violet-700 ring-1 ring-violet-500'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Degree Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Degree Type</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-3 border"
                      value={profile.degree_type}
                      onChange={e => setProfile({...profile, degree_type: e.target.value})}
                    >
                      <option value="LLB">LLB</option>
                      <option value="MLaw">MLaw</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Modules */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modules this year</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-3 border"
                      value={profile.modules}
                      onChange={e => setProfile({...profile, modules: e.target.value})}
                      placeholder="e.g. Contract Law, EU Law, LAW1231"
                    />
                    <p className="mt-1 text-xs text-gray-500">Add module names or codes, comma separated.</p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save & Continue'} <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                     <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       <Calendar className="text-violet-600"/> Timetable Import
                    </h2>
                     <p className="text-sm text-gray-500 mt-1">Paste your timetable text below.</p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                     <p className="text-sm text-blue-700">
                        <strong>MyDurhamLaw never asks for your password.</strong><br/>
                        Log into Learn Ultra or Banner in a new tab, copy your weekly schedule text, and paste it here.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paste your timetable text</label>
                      <textarea
                        rows={12}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-3 border font-mono"
                        placeholder={`Example:\nContract Law Lecture – Monday 9:00–11:00, Elvet Riverside 2\nCriminal Law Tutorial – Tuesday 14:00–15:00, PCL Rooms`}
                        value={timetableText}
                        onChange={e => setTimetableText(e.target.value)}
                      />
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={handleParseTimetable}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
                        >
                          Parse Text
                        </button>
                        <button
                           type="button"
                           onClick={() => setTimetableText('')}
                           className="px-4 py-2 text-gray-500 hover:text-red-500 transition-colors text-sm"
                        >
                           Clear
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-[340px] overflow-y-auto">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preview ({parsedEvents.length} events)</h3>
                       {parsedEvents.length === 0 ? (
                         <div className="text-center text-gray-400 mt-10 italic">
                            Parsed events will appear here...
                         </div>
                       ) : (
                         <div className="space-y-2">
                            {parsedEvents.map((evt, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm text-sm">
                                <div className="font-bold text-gray-800">{evt.title}</div>
                                <div className="text-gray-500 flex justify-between mt-1">
                                   <span>{evt.day}, {evt.startTime} - {evt.endTime}</span>
                                </div>
                                {evt.location && (
                                  <div className="text-xs text-gray-400 mt-1">📍 {evt.location}</div>
                                )}
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTimetable}
                      disabled={parsedEvents.length === 0 || saving}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Confirm & Save Timetable'} <Check className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
