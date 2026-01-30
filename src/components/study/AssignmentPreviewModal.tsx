import { useState } from "react";
import { X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Assignment } from "@/types/assignments";
import { format } from "date-fns";

interface AssignmentPreviewModalProps {
  assignment: Assignment;
  finalDraft: string | null;
  aiUsageLog: string[];
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function AssignmentPreviewModal({
  assignment,
  finalDraft,
  aiUsageLog,
  isOpen,
  onClose,
  onDownload,
}: AssignmentPreviewModalProps) {
  const [showAIDeclaration, setShowAIDeclaration] = useState(false);

  if (!isOpen || !finalDraft) return null;

  // Calculate word count
  const wordCount = finalDraft.trim().split(/\s+/).length;

  // Split content into paragraphs
  const paragraphs = finalDraft
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {assignment.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{assignment.module_code}</span>
              <span>•</span>
              <span>{assignment.module_name}</span>
              <span>•</span>
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded font-medium">
                {wordCount} words
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
          <div className="bg-white rounded-lg shadow-sm p-12 max-w-3xl mx-auto border border-gray-100">
            {/* Title Page Section - Force text-gray-900 because background is white "paper" */}
            <div className="text-center mb-12 pb-12 border-b-2 border-gray-200 text-gray-900">
              <h1
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                {assignment.module_code || "LAW MODULE"}
              </h1>
              <p
                className="text-xl mb-6"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                {assignment.module_name || "Law Assignment"}
              </p>
              <p
                className="text-gray-600 mb-2"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                Word Count: {wordCount} words
              </p>
              {assignment.due_date && (
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "Times New Roman, serif" }}
                >
                  Deadline: {format(new Date(assignment.due_date), "PPP")}
                </p>
              )}
            </div>

            {/* Essay Content */}
            <div className="space-y-4 text-gray-900">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-justify leading-relaxed"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "12pt",
                    lineHeight: "1.8",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* AI Declaration Section */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200 text-gray-900">
              <button
                onClick={() => setShowAIDeclaration(!showAIDeclaration)}
                className="flex items-center justify-between w-full text-left mb-4 text-gray-900 hover:text-purple-700 transition"
              >
                <h3
                  className="text-xl font-bold"
                  style={{ fontFamily: "Times New Roman, serif" }}
                >
                  Academic Integrity Declaration
                </h3>
                {showAIDeclaration ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {showAIDeclaration && (
                <div className="space-y-4">
                  <p
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "12pt",
                    }}
                  >
                    In accordance with Durham Law School's Generative AI Policy
                    (2025-26), the following AI assistance was used in preparing
                    this assignment:
                  </p>

                  {aiUsageLog.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {aiUsageLog.map((log, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontFamily: "Times New Roman, serif",
                            fontSize: "12pt",
                          }}
                        >
                          {log}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p
                      className="text-gray-600 italic"
                      style={{
                        fontFamily: "Times New Roman, serif",
                        fontSize: "12pt",
                      }}
                    >
                      No AI assistance was logged for this assignment.
                    </p>
                  )}

                  <p
                    className="italic mt-6"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "12pt",
                    }}
                  >
                    All substantive content and analysis is the student's
                    original work. AI tools were used only for permitted
                    purposes as outlined in the assessment guidelines. The
                    student takes full responsibility for the accuracy of all
                    content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Download Button */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-lg flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review your assignment before downloading
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download Word Document (.docx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
