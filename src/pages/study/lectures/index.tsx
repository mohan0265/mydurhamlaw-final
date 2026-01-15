'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AuthContext } from '@/lib/supabase/AuthContext';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, RefreshCw, FileAudio } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useStudentOnly } from '@/hooks/useStudentOnly';

const LectureUploadModal = dynamic(() => import('@/components/lectures/LectureUploadModal'), { ssr: false });
const LectureCard = dynamic(() => import('@/components/lectures/LectureCard'), { ssr: false });

interface Lecture {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  status: 'uploaded' | 'transcribing' | 'summarizing' | 'ready' | 'error';
  created_at: string;
}

export default function LecturesPage() {
  const router = useRouter();
  const { getDashboardRoute } = useContext(AuthContext);
  
  // Protect from loved ones
  const { isChecking: isRoleChecking, isLovedOne } = useStudentOnly();
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchLectures = useCallback(async () => {
    try {
      const res = await fetch('/api/lectures/list');
      if (res.ok) {
        const data = await res.json();
        setLectures(data.lectures || []);
      }
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  // Auto-refresh if any lectures are processing
  useEffect(() => {
    const hasProcessing = lectures.some(l => 
      l.status === 'transcribing' || l.status === 'summarizing' || l.status === 'uploaded'
    );
    if (hasProcessing) {
      const interval = setInterval(fetchLectures, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [lectures, fetchLectures]);

  const handleUploadSuccess = () => {
    fetchLectures();
  };

  const readyLectures = lectures.filter(l => l.status === 'ready');
  const processingLectures = lectures.filter(l => 
    l.status === 'transcribing' || l.status === 'summarizing' || l.status === 'uploaded'
  );
  const errorLectures = lectures.filter(l => l.status === 'error');

  // Show loading while checking role or if loved one (redirecting)
  if (isRoleChecking || isLovedOne) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
            variant="ghost"
            className="mb-2 text-sm flex items-center gap-1 text-gray-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">🎓 My Lectures</h1>
          <p className="text-gray-600 mt-1">Upload lecture recordings for AI transcription and notes</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lecture
        </Button>
      </div>

      {/* Processing Section */}
      {processingLectures.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <h2 className="text-sm font-medium text-gray-700">Processing ({processingLectures.length})</h2>
          </div>
          <div className="space-y-3">
            {processingLectures.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        </div>
      )}

      {/* Error Section */}
      {errorLectures.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-red-600 mb-3">Failed ({errorLectures.length})</h2>
          <div className="space-y-3">
            {errorLectures.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        </div>
      )}

      {/* Ready Lectures */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Your Lectures ({readyLectures.length})
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : readyLectures.length === 0 && processingLectures.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lectures yet</h3>
            <p className="text-gray-600 mb-4">
              Upload your lecture recordings and Durmah will transcribe them and generate study notes!
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Upload Your First Lecture
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {readyLectures.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <LectureUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
