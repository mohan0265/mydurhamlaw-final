"use client";

import { useState } from "react";
import { X, FileAudio, Loader2, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parsePanoptoTitle } from "@/lib/panopto-parser";

interface LectureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedModuleId?: string;
}

export default function LectureUploadModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedModuleId,
}: LectureUploadModalProps) {
  const [title, setTitle] = useState("");
  // If we have a module ID, we might ideally store it directly, but current logic uses code/name.
  // For now, let's keep it matching the legacy form fields or just use it in the POST
  const [moduleCode, setModuleCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Panopto import fields
  const [panoptoUrl, setPanoptoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  if (!isOpen) return null;

  const handlePanoptoImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript || !title) return;

    setUploading(true);
    setUploadProgress(10);
    setError("");

    try {
      const res = await fetch("/api/lectures/import-panopto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          module_id: preSelectedModuleId || null,
          module_code: moduleCode || null,
          module_name: moduleName || null,
          lecturer_name: lecturerName || null,
          lecture_date: lectureDate || null,
          panopto_url: panoptoUrl || null,
          transcript,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to import lecture");
      }

      setUploadProgress(100);

      // Reset form
      setTitle("");
      setModuleCode("");
      setModuleName("");
      setLecturerName("");
      setLectureDate("");
      setPanoptoUrl("");
      setTranscript("");

      onSuccess();
      onClose();

      // FIRE AND FORGET: Mark onboarding task as complete
      fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_key: "add_first_lecture" }),
      }).catch((err) =>
        console.warn("[Onboarding] Failed to mark lecture complete", err),
      );
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // --- SMART FILL LOGIC START ---

  const applySmartMetadata = (text: string) => {
    const meta = parsePanoptoTitle(text);
    let filled = false;

    if (meta.moduleCode) {
      setModuleCode(meta.moduleCode);
      filled = true;
    }
    if (meta.moduleName) {
      setModuleName(meta.moduleName);
      filled = true;
    }
    if (meta.lectureDate) {
      setLectureDate(meta.lectureDate);
      filled = true;
    }

    // Only update title if we found a "cleaner" one, otherwise keep user input
    // But if input WAS the raw header, we definitely want the clean one.
    if (meta.title && meta.title !== text) {
      setTitle(meta.title);
      filled = true;
    }

    return filled;
  };

  const handlePanoptoUrlChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const url = e.target.value;
    setPanoptoUrl(url);

    // If valid URL, try to fetch metadata
    if (url.length > 10 && url.startsWith("http")) {
      setIsFetchingMetadata(true);
      try {
        const res = await fetch(
          `/api/utils/fetch-metadata?url=${encodeURIComponent(url)}`,
        );
        const data = await res.json();

        if (data.success && data.title) {
          // Try to parse the title
          const usedSmart = applySmartMetadata(data.title);
          if (!usedSmart) {
            // Fallback: just use page title as lecture title if parser didn't trigger
            if (!title) setTitle(data.title);
          }
        }
      } catch (err) {
        console.warn("Metadata fetch failed", err);
      } finally {
        setIsFetchingMetadata(false);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    // instant smart parse on paste
    applySmartMetadata(val);
  };

  // --- SMART FILL LOGIC END ---

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Add Lecture</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Text Transcript Only
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePanoptoImport} className="p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
            <FileAudio className="w-5 h-5 flex-shrink-0" />
            <p>
              <strong>Tip:</strong> Copy the full transcript from Panopto (or
              your notes) and paste it below. We'll extract the summary, key
              cases, and exam points automatically.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g., Contract Law - Week 3: Consideration"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Module Code & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Code
              </label>
              <input
                type="text"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                placeholder="e.g., LAW1071"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Name
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., Contract Law"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Lecturer & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lecturer
              </label>
              <input
                type="text"
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                placeholder="e.g., Prof. Smith"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lecture Date
              </label>
              <input
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Panopto URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panopto Link{" "}
              <span className="text-violet-600 text-xs font-bold ml-2">
                ✨ Enables instant 1-click playback!
              </span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={panoptoUrl}
                onChange={handlePanoptoUrlChange}
                placeholder="https://durham.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=..."
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {isFetchingMetadata && (
                <span className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                </span>
              )}
              {panoptoUrl && (
                <a
                  href={panoptoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Lecture Transcript <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
              >
                <HelpCircle className="w-4 h-4" />
                How to copy from Panopto
              </button>
            </div>

            {showHelp && (
              <div className="mb-3 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm space-y-2">
                <p className="font-medium text-purple-900">
                  📋 Copy Panopto Captions:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-purple-800">
                  <li>Open your lecture in Panopto</li>
                  <li>
                    Click the <strong>"Captions"</strong> tab (left sidebar)
                  </li>
                  <li>Select all text (Ctrl+A or Cmd+A)</li>
                  <li>Copy (Ctrl+C or Cmd+C)</li>
                  <li>Paste here ⬇️</li>
                </ol>
              </div>
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Paste lecture captions here...

Example:
11:47 It might be necessary to look at academic sources...
11:54 and you're encouraged to do so in your essay questions.
12:05 In the problem questions, you need to rely on cases...`}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              rows={12}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {transcript.length.toLocaleString()} characters
                {transcript.length > 0 &&
                  ` • ~${transcript.split(/\s+/).length.toLocaleString()} words`}
              </span>
              {transcript.length > 0 && transcript.length < 100 && (
                <span className="text-xs text-amber-600">
                  ⚠ Transcript seems short
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing lecture with AI...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!transcript || !title || uploading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {uploading ? "Analyzing..." : "Import & Analyze"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
