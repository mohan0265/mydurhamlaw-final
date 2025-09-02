// src/components/DurmahWidget.tsx
// Final host-aware widget:
// - Uses Supabase + user from the host app via supabaseBridge
// - Saves transcripts to public.voice_conversations with optional academic context
// - One client, one session (RLS-safe). No duplicate Supabase instances.
// - Records BOTH roles (student=USER, Durmah=ASSISTANT).
// - Close (✕) reliably hides transcript; bubbles for each role.

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Save, Trash2, FileText, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useRealtimeVoice } from "../hooks/useRealtimeVoice";

type WidgetProps = {
  /** Optional academic context: pass from YAAG, module pages, etc. */
  context?: {
    route?: string;
    term?: "Michaelmas" | "Epiphany" | "Easter" | string;
    year_label?: string;      // e.g. "Year 1 (LLB)"
    module_id?: string;       // your modules table id (uuid or text)
    module_code?: string;     // e.g. "LAW1234"
    week?: string;            // e.g. "Week 5"
    tags?: string[];          // free-form labels
    extra?: Record<string, any>;
  };
};

type ChatMsg = { role: "user" | "assistant"; content: string };

// We keep these to normalize the hook's transcript (assistant lines).
type Line = { id: string; text: string };
type AnyLine = { id?: string | number; text?: string } | string;

function normalizeTranscript(arr: AnyLine[] | undefined | null): Line[] {
  if (!arr) return [];
  return arr.map((t, idx) => {
    if (typeof t === "string") return { id: String(idx), text: t };
    return { id: String(t.id ?? idx), text: String(t.text ?? "") };
  });
}

const fmtTime = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

export default function DurmahWidget({ context }: WidgetProps) {
  // Use *host* app auth so RLS == student's session
  const { user } = useAuth() || { user: null };

  // ---- Conversation model (what we render & save) ----
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  // ---- Voice hook (with user-final callback) ----
  const onUserFinal = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // de-dupe identical immediate repeats
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "user" && last.content === trimmed) return prev;
      return [...prev, { role: "user", content: trimmed }];
    });
  };

  const {
    status,              // "idle" | "connecting" | "connected"
    isConnected,
    isListening,
    isSpeaking,
    transcript,          // [{id,text}, ...] — typically assistant’s text
    partialTranscript,   // student's live partial while speaking
    connect,
    startVoiceMode,
    stopVoiceMode,
    lastError,
  } = useRealtimeVoice({ onUserFinal });

  // Track session start for metadata
  const sessionStartRef = useRef<string | null>(null);

  // Keep a normalized view of the hook's transcript (assistant lines),
  // so we can detect new assistant text and append to messages.
  const [assistantLines, setAssistantLines] = useState<Line[]>([]);
  useEffect(() => {
    setAssistantLines(normalizeTranscript(transcript as unknown as AnyLine[]));
  }, [transcript]);

  // Track prior count to detect "new assistant lines"
  const lastAssistantCount = useRef<number>(0);
  useEffect(() => {
    const count = assistantLines.length;
    const prev = lastAssistantCount.current;
    if (count > prev) {
      const newlyAdded = assistantLines.slice(prev);
      if (newlyAdded.length) {
        setMessages((prevMsgs) => {
          const next = [...prevMsgs];
          for (const l of newlyAdded) {
            const text = l.text.trim();
            if (!text) continue;
            const last = next[next.length - 1];
            // de-dupe identical assistant line
            if (!(last && last.role === "assistant" && last.content === text)) {
              next.push({ role: "assistant", content: text });
            }
          }
          return next;
        });
      }
      lastAssistantCount.current = count;
    }
  }, [assistantLines]);

  // ---- UI state ----
  const [showActions, setShowActions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [cloudId, setCloudId] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  // Show sheet whenever there is activity
  useEffect(() => {
    if (isListening || isSpeaking || messages.length > 0) {
      setShowSheet(true);
    } else if (!isListening && !isSpeaking && messages.length === 0) {
      setShowSheet(false);
    }
  }, [isListening, isSpeaking, messages.length]);

  // Human-readable transcript for copy/.txt
  const transcriptText = useMemo(
    () =>
      messages
        .map((m) => `${m.role === "user" ? "You" : "Durmah"}: ${m.content}`)
        .join("\n"),
    [messages]
  );

  const copyToClipboard = async () => {
    setSaveMsg(null);
    try {
      await navigator.clipboard.writeText(transcriptText || "");
      setSaveMsg("Copied to clipboard ✅");
    } catch (e: any) {
      setSaveMsg(`Copy failed: ${e?.message || e}`);
    }
  };

  const saveTxtFile = () => {
    setSaveMsg(null);
    const blob = new Blob([transcriptText || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `durmah-${fmtTime()}.txt`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const deleteLocal = () => {
    setSaveMsg(null);
    setMessages([]);
    setShowActions(false);
  };

  const closeTranscript = () => {
    setMessages([]);
    setShowActions(false);
    setSaveMsg(null);
    setCloudId(null);
    setShowSheet(false); // hide sheet now
  };

  // --- Save to Supabase with RLS (store JSON for both roles) ---
  const saveToCloud = async () => {
    setSaveMsg(null);
    if (messages.length === 0) {
      setSaveMsg("Nothing to save.");
      return;
    }
    setSaving(true);
    try {
      const sb = supabase;
      if (!sb) {
        setSaveMsg("Supabase not available.");
        setSaving(false);
        return;
      }
      const { data: { session } = { session: null } } = await sb.auth.getSession();
      const authedUser = session?.user ?? user;

      if (!authedUser) {
        setSaveMsg("Please sign in to save notes.");
        setSaving(false);
        return;
      }

      const started_at = sessionStartRef.current ?? new Date().toISOString();
      const ended_at = new Date().toISOString();

      const payload = {
        user_id: authedUser.id,
        title: `Durmah conversation ${fmtTime()}`,
        // store both roles as JSON
        content: JSON.stringify(messages),
        started_at,
        ended_at,
        metadata: {
          status,
          last_partial: partialTranscript || null,
          context: context || null,
          role_counts: {
            user: messages.filter((m) => m.role === "user").length,
            assistant: messages.filter((m) => m.role === "assistant").length,
          },
        },
        // Optional denormalized columns for easy filtering (also inside metadata)
        context_route: context?.route ?? null,
        context_term: context?.term ?? null,
        context_module_id: context?.module_id ?? null,
        context_module_code: context?.module_code ?? null,
        context_year_label: context?.year_label ?? null,
        context_week: context?.week ?? null,
        context_tags: context?.tags ?? null,
      };

      const { data, error } = await sb
        .from("voice_conversations")
        .insert([payload])
        .select("id")
        .single();

      if (error) throw error;
      setCloudId(data.id);
      setSaveMsg("Saved to cloud ✅");
    } catch (e: any) {
      setSaveMsg(`Save failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Delete from Supabase if saved ---
  const deleteFromCloud = async () => {
    setSaveMsg(null);
    if (!cloudId) {
      deleteLocal();
      return;
    }
    try {
      const sb = supabase;
      if (!sb) {
        setSaveMsg("Supabase not available.");
        return;
      }
      const { error } = await sb.from("voice_conversations").delete().eq("id", cloudId);
      if (error) throw error;
      setCloudId(null);
      setSaveMsg("Deleted from cloud ✅");
      deleteLocal();
    } catch (e: any) {
      setSaveMsg(`Delete failed: ${e?.message || e}`);
    }
  };

  // --- Toggle Voice Session ---
  const toggleVoice = async () => {
    setSaveMsg(null);
    if (!isConnected) {
      await connect().catch(() => {});
    }
    if (status === "connecting") return;

    if (isSpeaking || isListening) {
      stopVoiceMode();
      // Keep transcript visible for actions
    } else {
      setShowActions(false);
      setShowSheet(true);
      sessionStartRef.current = new Date().toISOString();
      await startVoiceMode().catch(() => {});
    }
  };

  const bubbleStatus = !isConnected
    ? "Offline"
    : isSpeaking
    ? "Speaking"
    : isListening
    ? "Listening"
    : "Connected";

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={toggleVoice}
        title={isListening || isSpeaking ? "End voice chat" : "Start voice chat"}
        className={`fixed right-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-xl transition
          ${isListening || isSpeaking ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
      >
        <span className="sr-only">Toggle voice</span>
        <svg viewBox="0 0 24 24" className="w-8 h-8 m-auto fill-white">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"></path>
          <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.08A7 7 0 0 0 19 11z"></path>
        </svg>
      </button>

      {/* Bottom Sheet with Transcript + Actions */}
      {showSheet && (
        <div className="fixed left-4 right-4 bottom-24 md:left-8 md:right-8 md:bottom-8 z-40">
          <div className="max-h-[60vh] overflow-hidden rounded-2xl bg-white/90 backdrop-blur shadow-2xl border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white/90 backdrop-blur">
              <div className="font-medium">Transcript</div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  {bubbleStatus} {lastError ? `• ${String(lastError)}` : ""}
                </div>
                <button
                  onClick={() => setShowActions((v) => !v)}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  {showActions ? "Hide actions" : "Actions"}
                </button>
                <button
                  onClick={closeTranscript}
                  className="rounded px-2 py-1 text-sm hover:bg-gray-100"
                  aria-label="Close transcript"
                  title="Close transcript"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Transcript */}
            <div className="p-4 h-[36vh] overflow-y-auto text-sm leading-6">
              {messages.length === 0 ? (
                <div className="text-gray-500">No transcript yet.</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                      <span
                        className={
                          "inline-block px-3 py-2 rounded " +
                          (m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-800")
                        }
                      >
                        {m.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* show live partial while speaking */}
              {isListening && partialTranscript && (
                <div className="mt-2 text-right">
                  <span className="inline-block px-3 py-2 rounded border text-gray-600 italic">
                    {partialTranscript}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="px-4 py-3 border-t flex flex-wrap gap-2 items-center">
                <button
                  onClick={saveTxtFile}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Save .txt
                </button>

                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>

                <button
                  onClick={deleteFromCloud}
                  className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete{cloudId ? " (cloud)" : ""}
                </button>

                <button
                  disabled={saving}
                  onClick={saveToCloud}
                  className={`px-3 py-2 rounded-lg text-white flex items-center gap-2 ${
                    saving ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save to cloud"}
                </button>

                {saveMsg && <div className="ml-2 text-sm text-gray-600">{saveMsg}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
