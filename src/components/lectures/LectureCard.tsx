"use client";

import {
  FileAudio,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Lecture {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  status: string;
  processing_state?:
    | "uploaded"
    | "queued"
    | "processing"
    | "processed"
    | "verified"
    | "failed";
  created_at: string;
}

interface LectureCardProps {
  lecture: Lecture;
  onDelete?: (id: string) => void;
}

const statusConfig: any = {
  uploaded: {
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-100",
    label: "Uploaded",
  },
  queued: {
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-50",
    label: "Queued",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-100",
    label: "Processing...",
  },
  processed: {
    icon: Loader2,
    color: "text-indigo-500",
    bg: "bg-indigo-100",
    label: "Verifying...",
  },
  verified: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-100",
    label: "Verified",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-100",
    label: "Failed",
  },
};

export default function LectureCard({ lecture }: LectureCardProps) {
  // Prefer new processing_state if available, fallback to legacy status
  const currentState = lecture.processing_state || lecture.status;
  const status = statusConfig[currentState] || statusConfig.failed;

  const StatusIcon = status.icon;
  const isProcessing =
    currentState === "processing" ||
    currentState === "processed" ||
    lecture.status === "transcribing" ||
    lecture.status === "summarizing";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Link href={`/study/lectures/${lecture.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileAudio className="w-5 h-5 text-purple-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {lecture.title}
              </h3>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {lecture.module_code && (
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                  {lecture.module_code}
                </span>
              )}
              {lecture.module_name && <span>{lecture.module_name}</span>}
            </div>

            {lecture.lecturer_name && (
              <p className="text-sm text-gray-500 mt-1">
                {lecture.lecturer_name}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              {/* Date */}
              <span className="text-xs text-gray-400">
                 {lecture.lecture_date
                  ? formatDate(lecture.lecture_date)
                  : formatDate(lecture.created_at)}
              </span>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {/* L-STATUS chips */}
                {/* Link Chip */}
                {lecture.panopto_url ? (
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Link added</span>
                ) : (
                  <span className="bg-gray-50 text-gray-400 text-[10px] px-1.5 py-0.5 rounded font-medium">No link</span>
                )}
                
                {/* Audio/Transcript Status (Approximation based on available fields) */}
                {lecture.status === 'ready' ? (
                   <span className="bg-green-50 text-green-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Transcript ready</span>
                ) : lecture.status === 'error' ? (
                   <span className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Transcript missing</span>
                ) : (
                   <span className="bg-yellow-50 text-yellow-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Processing...</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(lecture.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {/* Status Badge */}
                <span
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}
                >
                  <StatusIcon
                    className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`}
                  />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
