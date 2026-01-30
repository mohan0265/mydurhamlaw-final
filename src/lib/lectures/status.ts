export const LECTURE_STATUSES = {
  UPLOADED: "uploaded",
  QUEUED: "queued",
  PROCESSING: "processing",
  SUMMARIZING: "summarizing",
  READY: "ready",
  FAILED: "failed",
  // Legacy statuses for backward compatibility
  TRANSCRIBING: "transcribing",
  ERROR: "error",
} as const;

export type LectureStatus =
  (typeof LECTURE_STATUSES)[keyof typeof LECTURE_STATUSES];

export const ALLOWED_STATUSES = Object.values(LECTURE_STATUSES);
