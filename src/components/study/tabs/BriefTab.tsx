import { Assignment } from "@/types/assignments";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

interface BriefTabProps {
  assignment: Assignment;
  onUpdate: () => void;
}

export default function BriefTab({ assignment, onUpdate }: BriefTabProps) {
  const [brief, setBrief] = useState("");
  const [wordCount, setWordCount] = useState<number | "">("");
  const [weightage, setWeightage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Prefer brief_rich, fallback to question_text
    let b = "";
    if (typeof assignment.brief_rich === "string") b = assignment.brief_rich;
    else if (assignment.brief_rich && typeof assignment.brief_rich === "object")
      b = JSON.stringify(assignment.brief_rich);
    else b = assignment.question_text || "";

    setBrief(b);
    setWordCount(assignment.word_count_target || "");
    setWeightage(assignment.weightage || "");
  }, [assignment]);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseClient();
    try {
      const updates = {
        brief_rich: brief,
        word_count_target: wordCount === "" ? null : Number(wordCount),
        weightage: weightage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("assignments")
        .update(updates)
        .eq("id", assignment.id);

      if (error) throw error;
      toast.success("Assignment saved."); // A-SUCCESS-1
      onUpdate();
    } catch (e) {
      toast.error("Failed to save");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Word Target
          </label>
          <input
            type="number"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            value={wordCount}
            onChange={(e) =>
              setWordCount(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 2000"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Weightage
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            value={weightage}
            onChange={(e) => setWeightage(e.target.value)}
            placeholder="e.g. 40%"
          />
        </div>
        <div className="flex-none self-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
            Detailed Brief / Instructions
          </label>
          <button
            onClick={() => {
              // Simple Blackboard Parser
              const text = brief;
              let updates: any = {};
              let toastMsg = "Parsed: ";

              // 1. Word Count matching "Word count: 2000" or "Length: 2000 words"
              const wordMatch = text.match(
                /(?:word count|length|limit)[:\s]+(\d{1,5})/i,
              );
              if (wordMatch) {
                updates.wordCount = wordMatch[1];
                setWordCount(Number(wordMatch[1]));
                toastMsg += `Word Count (${wordMatch[1]}) `;
              }

              // 2. Weighting matching "Weighting: 40%" or "40% of module"
              const weightMatch = text.match(/(\d{1,3}%)(?:\s+of\s+module)?/i);
              if (weightMatch) {
                updates.weightage = weightMatch[1];
                setWeightage(weightMatch[1]);
                toastMsg += `Weighting (${weightMatch[1]}) `;
              }

              if (Object.keys(updates).length > 0) {
                toast.success(toastMsg);
              } else {
                toast(
                  "No standard patterns found. Try pasting the full Blackboard specification.",
                  { icon: "ℹ️" },
                );
              }
            }}
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded transition"
          >
            ✨ Auto-Extract Details
          </button>
        </div>
        <textarea
          className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm leading-relaxed focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none font-mono text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Assignment created. Add the brief or file when you’re ready."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] text-gray-400 font-medium">
            Changes are saved automatically.
          </p>
          <p className="text-xs text-gray-400">
            Supports Markdown (coming soon)
          </p>
        </div>
      </div>
    </div>
  );
}
