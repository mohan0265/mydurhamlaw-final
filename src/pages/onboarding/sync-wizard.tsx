import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Calendar, Link as LinkIcon, CheckCircle2, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';

export default function SyncWizardPage() {
  const router = useRouter();
  const [timetableUrl, setTimetableUrl] = useState('');
  const [blackboardUrl, setBlackboardUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    results?: {
      timetable: { events: number; assessments: number; status: string };
      blackboard: { events: number; assessments: number; status: string };
    };
  } | null>(null);

  const handleSync = async () => {
    if (!timetableUrl && !blackboardUrl) {
      toast.error('Please enter at least one calendar URL');
      return;
    }

    setSyncing(true);
    const toastId = toast.loading('Syncing your calendars...');

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please log in to sync calendars', { id: toastId });
        router.push('/login');
        return;
      }

      const response = await fetch('/api/onboarding/sync-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          timetableUrl: timetableUrl.trim(),
          blackboardUrl: blackboardUrl.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResult(data);
      toast.success('Calendars synced successfully!', { id: toastId });
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync calendars', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Sync Your University Life - MyDurhamLaw</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sync Your University Life
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect your MyTimetable and Blackboard calendars to keep everything in one place.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {!syncResult ? (
            <div className="space-y-6">
              {/* MyTimetable Section */}
              <div>
                <label htmlFor="timetable" className="block text-sm font-medium text-purple-900">
                  MyTimetable Subscription URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex-grow focus-within:z-10">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <LinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="url"
                      name="timetable"
                      id="timetable"
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 border"
                      placeholder="https://mytimetable.durham.ac.uk/..."
                      value={timetableUrl}
                      onChange={(e) => setTimetableUrl(e.target.value)}
                    />
                  </div>
                </div>
                <details className="mt-2 text-xs text-gray-500 cursor-pointer">
                  <summary className="hover:text-purple-600 font-medium">How to find this URL?</summary>
                  <ol className="list-decimal pl-4 mt-2 space-y-1 ml-2">
                    <li>Go to <a href="https://mytimetable.durham.ac.uk" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">MyTimetable</a></li>
                    <li>Open <strong>Settings</strong> (top right)</li>
                    <li>Look for <strong>Subscribe</strong> or <strong>Connect Calendar</strong></li>
                    <li>Copy the URL provided</li>
                  </ol>
                </details>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Blackboard Section */}
              <div>
                <label htmlFor="blackboard" className="block text-sm font-medium text-orange-900">
                  Blackboard Calendar URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex-grow focus-within:z-10">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <LinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="url"
                      name="blackboard"
                      id="blackboard"
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 border"
                      placeholder="https://blackboard.durham.ac.uk/..."
                      value={blackboardUrl}
                      onChange={(e) => setBlackboardUrl(e.target.value)}
                    />
                  </div>
                </div>
                <details className="mt-2 text-xs text-gray-500 cursor-pointer">
                  <summary className="hover:text-orange-600 font-medium">How to find this URL?</summary>
                  <ol className="list-decimal pl-4 mt-2 space-y-1 ml-2">
                    <li>Go to <a href="https://blackboard.durham.ac.uk/ultra/calendar" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">Blackboard Calendar</a></li>
                    <li>Click <strong>Calendar Settings</strong> (gear icon)</li>
                    <li>Select <strong>Share Calendar</strong></li>
                    <li>Copy the calendar link</li>
                  </ol>
                </details>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSync}
                  disabled={syncing || (!timetableUrl && !blackboardUrl)}
                  className="flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {syncing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Syncing...
                    </span>
                  ) : 'Sync Calendars'}
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sync Complete!</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
                {syncResult.results?.timetable.status === 'success' && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-purple-600 font-semibold">MyTimetable:</span>
                    <span className="text-gray-600">
                      Imported {syncResult.results.timetable.events} lectures
                    </span>
                  </div>
                )}
                {syncResult.results?.blackboard.status === 'success' && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 font-semibold">Blackboard:</span>
                    <span className="text-gray-600">
                      Imported {syncResult.results.blackboard.assessments} assignments
                    </span>
                  </div>
                )}
                {(syncResult.results?.timetable.status === 'failed' || syncResult.results?.blackboard.status === 'failed') && (
                  <div className="flex items-start gap-2 text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>Some calendars failed to sync. Please check your URLs and try again later.</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleContinue}
                className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-purple-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Your calendar data is stored securely and only used to help you study.
            <br />
            You can re-sync or update your URLs in your profile settings anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
