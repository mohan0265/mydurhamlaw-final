"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Save, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface GlossaryNoteSectionProps {
  termId: string;
}

export const GlossaryNoteSection: React.FC<GlossaryNoteSectionProps> = ({
  termId,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/study/glossary/notes?termId=${termId}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || "");
        }
      } catch (err) {
        console.error("Failed to fetch glossary notes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [termId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/study/glossary/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId, notes }),
      });

      if (res.ok) {
        toast.success("Notes saved to Lexicon!");
        setHasChanges(false);
      } else {
        toast.error("Failed to save notes");
      }
    } catch (err) {
      toast.error("Error saving notes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading your notes...
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <MessageSquare className="w-3.5 h-3.5" />
          Personal Reinforced Learning Notes
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 transition"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save Changes
          </button>
        )}
      </div>

      <div className="relative group">
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Add comments, mindmap ideas, or additional context to help you remember this term better..."
          className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition-all min-h-[120px] placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none group-focus-within:opacity-50 transition-opacity">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      <p className="mt-2 text-[10px] text-gray-400 italic">
        These notes are private and linked specifically to your Lexicon entry
        for reinforced learning.
      </p>
    </div>
  );
};
