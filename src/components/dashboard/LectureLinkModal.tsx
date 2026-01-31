import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";
import { X } from "lucide-react";

interface LectureLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LectureLinkModal({
  isOpen,
  onClose,
  onSuccess,
}: LectureLinkModalProps) {
  const [provider, setProvider] = useState("Panopto");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!url) return toast.error("Please enter a folder URL");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase.from("lecture_links_config").upsert({
        user_id: user.id,
        provider,
        folder_url: url,
      });

      if (error) throw error;

      // Also mark as onboarded for this step?
      // The syncOnboardingState function will handle it on next load/sync.
      // We can manually trigger sync here if we want immediate feedback, but let's leave it to the parent or next reload.

      toast.success("Lecture links saved!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Set Lecture Links
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Paste your lecture folder link once for 1-click access all term.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="Panopto">Panopto</option>
              <option value="Echo360">Echo360</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Folder URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://durham.cloud.panopto.eu/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Copy the link to your main module folder.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
