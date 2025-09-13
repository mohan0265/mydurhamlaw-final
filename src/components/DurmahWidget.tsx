// src/components/DurmahWidget.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Copy, Save, Trash2, FileText, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";

const VOICE_OPTIONS = [
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", label: "Roger" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica" },
];

type WidgetProps = {
  context?: {
    route?: string;
    term?: "Michaelmas" | "Epiphany" | "Easter" | string;
    year_label?: string;
    module_id?: string;
    module_code?: string;
    week?: string;
    tags?: string[];
    extra?: Record<string, any>;
  };
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const fmtTime = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

export default function DurmahWidget({ context }: WidgetProps) {
  const { user } = useAuth() || { user: null };

  const {
    status,
    isConnected,
    isListening,
    isSpeaking: webrtcSpeaking,
    transcript,        // NOW includes both student + assistant lines
    partialTranscript, // live user partial
    connect,
    startVoiceMode,
    stopVoiceMode,
    lastError,
  } = useRealtimeVoice();

  // ElevenLabs TTS (assistant speech)
  const {
    isSpeaking: ttsSpeaking,
    speak,
    stop: stopTTS,
    provider,
    voiceId,
    setVoiceId,
  } = useElevenLabsTTS();

  // Track session start for metadata
  const sessionStartRef = useRef<string | null>(null);

  // Conversation we render & save
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const lastCountRef = useRef<number>(0);

  // On each transcript growth, append new items (respect role)
  useEffect(() => {
    if (!transcript || transcript.length === lastCountRef.current) return;
    const newly = transcript.slice(lastCountRef.current);
    if (newly.length) {
      const mapped = newly
        .map((l: any) => ({ role: l.role as "user" | "assistant", content: (l.text || "").trim() }))
        .filter((m: ChatMsg) => !!m.content);

      // speak assistant lines
      mapped.forEach((m) => {
        if (m.role === "assistant") speak(m.content);
      });

      setMessages((prev) => [...prev, ...mapped]);
    }
    lastCountRef.current = transcript.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // UI state
  const [showActions, setShowActions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [cloudId, setCloudId] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  // Show sheet whenever there is activity
  useEffect(() => {
    if (isListening || webrtcSpeaking || ttsSpeaking || messages.length > 0) setShowSheet(true);
    else if (!isListening && !webrtcSpeaking && !ttsSpeaking && messages.length === 0) setShowSheet(false);
  }, [isListening, webrtcSpeaking, ttsSpeaking, messages.length]);

  const transcriptText = useMemo(
    () => messages.map((m) => `${m.role === "user" ? "Student" : "Durmah"}: ${m.content}`).join("\n"),
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

  const deleteLocal = useCallback(() => {
    setSaveMsg(null);
    setMessages([]);
    setShowActions(false);
    lastCountRef.current = 0;
    stopTTS();
  }, [stopTTS]);

  const closeTranscript = () => {
    deleteLocal();
    setCloudId(null);
    setShowSheet(false);
  };

  // --- Save to Supabase (JSON of both roles) ---
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
        content: JSON.stringify(messages),
        started_at,
        ended_at,
        metadata: {
          status,
          last_partial: partialTranscript || null,
          context: context || null,
        },
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

  // --- Voice: start / hard stop (no more grey-lock) ---
  const hardStop = useCallback(() => {
    try { stopTTS(); } catch {}
    try { stopVoiceMode(); } catch {}
  }, [stopTTS, stopVoiceMode]);

  const toggleVoice = async () => {
    setSaveMsg(null);
    if (!isConnected) {
      try { await connect(); } catch {}
    }
    if (status === "connecting") return;

    if (webrtcSpeaking || isListening || ttsSpeaking) {
      hardStop();
    } else {
      setShowActions(false);
      setShowSheet(true);
      sessionStartRef.current = new Date().toISOString();
      try { await startVoiceMode(); } catch {}
    }
  };

  const bubbleStatus = !isConnected
    ? "Offline"
    : (webrtcSpeaking || ttsSpeaking)
    ? "Speaking"
    : isListening
    ? "Listening"
    : "Connected";

  useEffect(() => {
    return () => { hardStop(); };
  }, [hardStop]);

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={toggleVoice}
        title={isListening || webrtcSpeaking || ttsSpeaking ? "End chat (stop mic/voice)" : "Start voice"}
        className={`fixed right-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-xl transition
          ${isListening || webrtcSpeaking || ttsSpeaking ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
      >
        <span className="sr-only">{isListening || webrtcSpeaking || ttsSpeaking ? "End Chat" : "Start Voice"}</span>
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

              <div className="flex items-center gap-3 flex-wrap justify-end">
                {/* status */}
                <div className="text-sm text-gray-600">
                  {bubbleStatus} {lastError ? `• ${String(lastError)}` : ""}
                </div>

                {/* 🔊 Voice picker + Test button + provider tag */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Voice:</span>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                    title="Choose ElevenLabs voice"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const name = VOICE_OPTIONS.find((v) => v.id === voiceId)?.label || "this";
                      speak(
                        `Hi! I'm ${name}, an ElevenLabs voice for MyDurhamLaw. How can I help today?`,
                        { interrupt: true }
                      );
                    }}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                    title="Play a short sample"
                  >
                    Test
                  </button>
                  <span className="text-xs text-gray-500">({provider})</span>
                </div>

                {/* actions toggle */}
                <button
                  onClick={() => setShowActions((v) => !v)}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  {showActions ? "Hide actions" : "Actions"}
                </button>

                {/* close */}
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

              {/* live user partial */}
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
