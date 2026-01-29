"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileAudio, ChevronRight, Plus, Loader2 } from "lucide-react";

interface Lecture {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecture_date?: string;
  status: string;
}

export default function MyLecturesWidget() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await fetch("/api/lectures/list?limit=3&status=ready");
        if (res.ok) {
          const data = await res.json();
          setLectures(data.lectures || []);
        }
      } catch (error) {
        console.error("Failed to fetch lectures:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-purple-600" />
          My Lectures
        </h3>
        <Link
          href="/study/lectures"
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : lectures.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">No lectures yet</p>
          <Link
            href="/study/lectures"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add your first lecture
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lectures.map((lecture) => (
            <Link
              key={lecture.id}
              href={`/study/lectures/${lecture.id}`}
              className="block p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lecture.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lecture.module_code && `${lecture.module_code} • `}
                    {formatDate(lecture.lecture_date)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Review Prompt */}
      {lectures.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            💡 <span className="font-medium">Before your next class?</span>{" "}
            Review past lecture notes!
          </p>
        </div>
      )}
    </div>
  );
}
