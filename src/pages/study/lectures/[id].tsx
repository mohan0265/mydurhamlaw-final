'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  FileAudio, 
  Calendar, 
  User, 
  Book, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  GraduationCap,
  BookOpen,
  Loader2
} from 'lucide-react';

interface LectureDetail {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  status: string;
  transcript?: string;
  word_count?: number;
  notes?: {
    summary?: string;
    key_points?: string[];
    discussion_topics?: string[];
    exam_prompts?: string[];
    glossary?: Array<{ term: string; definition: string }>;
  };
}

export default function LectureDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'keypoints' | 'discussion' | 'exam' | 'glossary'>('summary');

  useEffect(() => {
    if (!id) return;
    
    const fetchLecture = async () => {
      try {
        const res = await fetch(`/api/lectures/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setLecture(data.lecture);
        }
      } catch (error) {
        console.error('Failed to fetch lecture:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Lecture not found</h1>
        <Button onClick={() => router.push('/study/lectures')} className="mt-4">
          Back to Lectures
        </Button>
      </div>
    );
  }

  const notes = lecture.notes;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <Button
        onClick={() => router.push('/study/lectures')}
        variant="ghost"
        className="mb-4 text-sm flex items-center gap-1 text-gray-600 hover:text-purple-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lectures
      </Button>

      {/* Lecture Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileAudio className="w-7 h-7 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              {lecture.module_code && (
                <span className="flex items-center gap-1">
                  <Book className="w-4 h-4" />
                  {lecture.module_code} {lecture.module_name && `- ${lecture.module_name}`}
                </span>
              )}
              {lecture.lecturer_name && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {lecture.lecturer_name}
                </span>
              )}
              {lecture.lecture_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(lecture.lecture_date)}
                </span>
              )}
            </div>

            {lecture.word_count && (
              <p className="text-sm text-gray-500 mt-2">
                {lecture.word_count.toLocaleString()} words transcribed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes Tabs */}
      {notes && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          {/* Tab Navigation */}
          <div className="flex border-b overflow-x-auto">
            {[
              { key: 'summary', label: 'Summary', icon: BookOpen },
              { key: 'keypoints', label: 'Key Points', icon: Lightbulb },
              { key: 'discussion', label: 'Discussion', icon: MessageSquare },
              { key: 'exam', label: 'Exam Prep', icon: GraduationCap },
              { key: 'glossary', label: 'Glossary', icon: HelpCircle },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === tab.key 
                    ? 'border-purple-600 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'summary' && notes.summary && (
              <div className="prose prose-purple max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{notes.summary}</p>
              </div>
            )}

            {activeTab === 'keypoints' && notes.key_points && (
              <ul className="space-y-3">
                {notes.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'discussion' && notes.discussion_topics && (
              <ul className="space-y-4">
                {notes.discussion_topics.map((topic, i) => (
                  <li key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-gray-800">{topic}</p>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'exam' && notes.exam_prompts && (
              <ul className="space-y-4">
                {notes.exam_prompts.map((prompt, i) => (
                  <li key={i} className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                        Q{i + 1}
                      </span>
                      <p className="text-gray-800">{prompt}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'glossary' && notes.glossary && (
              <dl className="space-y-3">
                {notes.glossary.map((item, i) => (
                  <div key={i} className="flex">
                    <dt className="font-semibold text-purple-700 w-1/3 flex-shrink-0">{item.term}</dt>
                    <dd className="text-gray-600">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}

      {/* Transcript Collapsible */}
      {lecture.transcript && (
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Full Transcript</span>
            {showTranscript ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {showTranscript && (
            <div className="p-4 pt-0 border-t">
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto">
                {lecture.transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ask Durmah CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
        <p className="text-gray-700 mb-3">
          <strong>💡 Tip:</strong> Click the Durmah widget and ask questions about this lecture!
        </p>
        <p className="text-sm text-gray-500">
          Try: "Explain the key points from my {lecture.module_name || 'recent'} lecture"
        </p>
      </div>
    </div>
  );
}
