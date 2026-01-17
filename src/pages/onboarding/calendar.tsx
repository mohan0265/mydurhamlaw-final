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
    router.push('/onboarding');
  };

  const handleComplete = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* ... keeping logic ... */}
                    </ol>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs text-purple-700">
                      <strong>💡 Pro Tip:</strong> The Assignment Widget remembers where you left off, so you can resume anytime!
                    </p>
                  </div>
                </div>

                {/* Continue/Back buttons */}
                <button
                  onClick={handleComplete}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 mb-3"
                >
                  Back to Setup Checklist
                </button>
                
                {/* Direct Link to YAAG */}
                <button
                  onClick={() => router.push('/year-at-a-glance')}
                  className="w-full px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
                >
                  View Year at a Glance →
                </button>
              </div>
                
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
