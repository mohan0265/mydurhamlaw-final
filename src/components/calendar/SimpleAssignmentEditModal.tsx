import { X, Calendar, Clock, Type, AlignLeft, AlertCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import InterventionBanner from "@/components/forms/InterventionBanner";
import { isSuspiciousDate } from "@/lib/guards/smartInputGuards";

interface SimpleAssignmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  assignment: any;
}

export default function SimpleAssignmentEditModal({
  isOpen,
  onClose,
  onSave,
  assignment,
}: SimpleAssignmentEditModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    dueTime: "",
    wordLimit: "",
    effort: "",
  });
  const [saving, setSaving] = useState(false);

  // Intervention State
  const [intervention, setIntervention] = useState<{
    isVisible: boolean;
    message: string;
    suggestion?: string;
  }>({ isVisible: false, message: "" });

  useEffect(() => {
    if (isOpen && assignment) {
      // Parse due date
      const due = new Date(assignment.meta?.due_date || assignment.date);
      const dateStr = due.toISOString().substring(0, 10);
      const timeStr = due.toISOString().substring(11, 16);

      setFormData({
        title: assignment.title || "",
        dueDate: dateStr,
        dueTime: timeStr,
        wordLimit: assignment.meta?.word_limit || "",
        effort: assignment.meta?.estimated_effort || "",
      });
    }
  }, [isOpen, assignment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = getSupabaseClient();

      // Construct timestamp
      const timestamp = `${formData.dueDate}T${formData.dueTime}:00Z`;

      const { error } = await supabase
        .from("assignments")
        .update({
          title: formData.title,
          due_date: timestamp,
          word_limit: formData.wordLimit ? parseInt(formData.wordLimit) : null,
          estimated_effort: formData.effort ? parseInt(formData.effort) : null,
        })
        .eq("id", assignment.meta.assignmentId);

      if (error) throw error;

      toast.success("Assignment updated");
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update assignment");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !assignment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Edit Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <InterventionBanner
            isVisible={intervention.isVisible}
            message={intervention.message}
            suggestion={intervention.suggestion}
            onDismiss={() =>
              setIntervention({ ...intervention, isVisible: false })
            }
          />
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Assignment Title
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, dueDate: value });
                    const check = isSuspiciousDate(value);
                    if (check.isSuspicious) {
                      setIntervention({
                        isVisible: true,
                        message:
                          check.reason === "Date in the past"
                            ? "This due date is in the past. Save anyway?"
                            : "This date looks quite far ahead. Save anyway?",
                        suggestion:
                          check.reason === "Date in the past"
                            ? undefined
                            : "Time not set — we’ll use 23:59.", // Using A-DATE-3 hint
                      });
                    } else if (intervention.isVisible) {
                      setIntervention({ ...intervention, isVisible: false });
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) =>
                    setFormData({ ...formData, dueTime: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Word Limit
              </label>
              <input
                type="number"
                value={formData.wordLimit}
                onChange={(e) =>
                  setFormData({ ...formData, wordLimit: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g. 2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Effort (Hours)
              </label>
              <input
                type="number"
                value={formData.effort}
                onChange={(e) =>
                  setFormData({ ...formData, effort: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g. 10"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition shadow disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
