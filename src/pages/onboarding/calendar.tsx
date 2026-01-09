'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Upload, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function CalendarImportPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [imported, setImported] = useState(false);
  const [eventsCount, setEventsCount] = useState(0);
  const [assessmentsCount, setAssessmentsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.ics')) {
      toast.error('Please upload an .ics calendar file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get Supabase session token
      const supabase = getSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Please login to upload calendar');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/onboarding/ics', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}` // Add auth token
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImported(true);
      setEventsCount(data.imported.events || 0);
      setAssessmentsCount(data.imported.assessments || 0);
      
      toast.success(`Imported ${data.imported.events} events and ${data.imported.assessments} assessments!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };



  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Calendar className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import Your Calendar
          </h1>
          <p className="text-gray-600">
            Upload your Blackboard calendar file to sync events and deadlines
          </p>
          <p className="text-sm text-purple-600 mt-2">
            💡 You can re-upload anytime to refresh updates from Blackboard
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!imported ? (
            <>
              {/* File Upload Only */}
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text gray-700 mb-2">
                  Drop your .ics file here
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <button
                  disabled={uploading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Select File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  📥 How to download your Blackboard calendar file:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to Blackboard → Calendar (left sidebar)</li>
                  <li>Click "Calendar Settings" (gear icon)</li>
                  <li>Click "Share calendar" button</li>
                  <li>Click the calendar link to download the .ics file</li>
                  <li>Upload the downloaded file above</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>💫 Pro tip:</strong> Download and re-upload anytime to refresh your calendar with the latest changes from Blackboard.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900">Upload Error</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Skip Option */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Skip for now →
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Calendar Imported Successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your timetable and deadlines are now available in your dashboard
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{eventsCount}</div>
                    <div className="text-sm text-gray-600">Calendar Events</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{assessmentsCount}</div>
                    <div className="text-sm text-gray-600">Assessment Deadlines</div>
                  </div>
                </div>

                {/* Warning Banner */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-6 text-left">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Important:</strong> Always verify deadlines and events against official Durham systems. 
                    This import is for your convenience only.
                  </p>
                </div>

                {/* Next Steps Guidance */}
                <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 mb-6 text-left">
                  <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">📌</span>
                    Next Steps - Get the Most Out of MyDurhamLaw
                  </h4>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>
                      <strong>Go to YAAG</strong> (Year at a Glance) to see your entire academic year in 3 terms
                    </li>
                    <li>
                      <strong>Click any assignment deadline</strong> to open the Assignment Widget
                    </li>
                    <li>
                      <strong>Upload your assignment brief PDF</strong> inside the widget for AI-powered guidance
                    </li>
                    <li>
                      <strong>Follow the stages</strong> to research, outline, and draft with Durmah's help
                    </li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs text-purple-700">
                      <strong>💡 Pro Tip:</strong> The Assignment Widget remembers where you left off, so you can resume anytime!
                    </p>
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleComplete}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 mb-3"
                >
                  Go to Dashboard
                </button>
                
                {/* Direct Link to YAAG */}
                <button
                  onClick={() => router.push('/year-at-a-glance')}
                  className="w-full px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
                >
                  View Year at a Glance →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your calendar data is stored securely and never shared. 
            <br />
            <strong>We never ask for your Blackboard password.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
