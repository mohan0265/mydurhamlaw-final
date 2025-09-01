// src/components/lounge/LoungeComposer.tsx
import React, { useEffect, useRef, useState } from "react";
import SectionCard from "./SectionCard";
import FirstPostCelebration from "./FirstPostCelebration";
import { uploadPublicFile } from "@/lib/uploadToSupabase";
import type { LoungePost } from "./LoungePostCard";

const MAX_BODY = 3000;
const BAD_WORDS = ["idiot", "stupid", "hate you", "kill yourself", "racist", "sexist"];

export default function LoungeComposer({
  onPosted,
}: {
  onPosted: (p: LoungePost) => void;
}) {
  const [body, setBody] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFirstPost, setIsFirstPost] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setUid(user?.id ?? null);
      if (!user) return;
      
      // Check if this would be their first post
      const { data: existingPosts } = await supabase
        .from("lounge_posts")
        .select("id")
        .eq("author_id", user.id)
        .limit(1);
      
      if (mounted) {
        setIsFirstPost(existingPosts?.length === 0);
      }
      
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (mounted) setDisplayName(prof?.display_name ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [body]);

  // Expand on focus/content
  useEffect(() => {
    if (body.length > 0 || imgFile || audioFile) {
      setIsExpanded(true);
    }
  }, [body, imgFile, audioFile]);

  // Enhanced drag and drop for image
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const f = e.dataTransfer?.files?.[0];
      if (!f) return;
      
      if (f.type.startsWith("image/")) {
        if (f.size > 3 * 1024 * 1024) {
          setWarn("Image is larger than 3 MB");
          return;
        }
        setImgFile(f);
        setImgPreview(URL.createObjectURL(f));
        setWarn(null);
      } else if (f.type.startsWith("audio/")) {
        if (f.size > 2 * 1024 * 1024) {
          setWarn("Audio file is larger than 2 MB");
          return;
        }
        setAudioFile(f);
        setWarn(null);
      } else {
        setWarn("Please upload an image or audio file");
      }
    };

    el.addEventListener("dragenter", handleDrag);
    el.addEventListener("dragover", handleDrag);
    el.addEventListener("dragleave", handleDrag);
    el.addEventListener("drop", handleDrop);
    
    return () => {
      el.removeEventListener("dragenter", handleDrag);
      el.removeEventListener("dragover", handleDrag);
      el.removeEventListener("dragleave", handleDrag);
      el.removeEventListener("drop", handleDrop);
    };
  }, []);

  function clientModerationCheck(text: string) {
    const t = text.toLowerCase();
    for (const w of BAD_WORDS) {
      if (t.includes(w)) return `Let's keep our legal community positive and supportive. Please consider rephrasing before sharing.`;
    }
    return null;
  }

  async function submit() {
    if (!uid) {
      setWarn("Please log in to join the conversation");
      return;
    }
    if (!body.trim()) {
      setWarn("Share your thoughts-we'd love to hear from you!");
      return;
    }

    const localWarn = clientModerationCheck(body);
    if (localWarn) {
      setWarn(localWarn);
      return;
    }

    setPosting(true);
    setWarn(null);
    setSuccess(null);
    
    try {
      let image_url: string | null = null;
      let audio_url: string | null = null;

      if (imgFile) {
        try {
          const up = await uploadPublicFile(imgFile, "images");
          image_url = up.url;
        } catch (err: any) {
          throw new Error("Failed to upload image: " + (err.message || "Unknown error"));
        }
      }
      
      if (audioFile) {
        if (!/^audio\/(webm|m4a|mp4|mpeg|ogg)/.test(audioFile.type)) {
          setWarn("Audio type must be webm, m4a, mp4, mpeg or ogg");
          setPosting(false);
          return;
        }
        if (audioFile.size > 2 * 1024 * 1024) {
          setWarn("Audio file is larger than 2 MB");
          setPosting(false);
          return;
        }
        try {
          const up = await uploadPublicFile(audioFile, "audio");
          audio_url = up.url;
        } catch (err: any) {
          throw new Error("Failed to upload audio: " + (err.message || "Unknown error"));
        }
      }

      const { supabase } = await import("@/lib/supabase-browser");
      const { data: rpc, error } = await supabase.rpc("create_lounge_post", {
        p_body: body,
        p_image_url: image_url,
        p_audio_url: audio_url,
      });
      
      if (error) throw error;

      // optimistic local object
      const newPost: LoungePost = {
        id: rpc as string,
        author_id: uid,
        author_display_name: displayName || "Student",
        body,
        image_url,
        audio_url,
        created_at: new Date().toISOString(),
        is_shadow_muted: false,
        automod_flag: false,
      };
      
      onPosted(newPost);
      
      // Show celebration for first post
      if (isFirstPost) {
        setShowCelebration(true);
        setIsFirstPost(false); // Update state so we don't show it again
      }
      
      // Show success and reset
      setSuccess(isFirstPost ? "Welcome to the Lounge! 🎉" : "Your post has been shared! 🎉");
      resetForm();
      
      // Auto-hide success message
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (e: any) {
      setWarn(e.message || "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  function resetForm() {
    setBody("");
    setImgFile(null);
    setImgPreview(null);
    setAudioFile(null);
    setWarn(null);
    setIsExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function removeImage() {
    setImgFile(null);
    setImgPreview(null);
  }

  function removeAudio() {
    setAudioFile(null);
  }

  const charCount = body.length;
  const charPercentage = (charCount / MAX_BODY) * 100;
  const isNearLimit = charPercentage > 80;
  const isOverLimit = charPercentage > 100;

  return (
    <>
      <FirstPostCelebration 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      
      <SectionCard 
        title="Share your thoughts" 
        right={
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Online</span>
          </div>
        }
      >
      <div 
        ref={dropRef}
        className={`relative transition-all duration-200 ${
          dragActive ? 'ring-2 ring-purple-300 ring-opacity-50 bg-purple-50/50 rounded-xl p-2' : ''
        }`}
      >
        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-purple-100/80 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-2xl mb-2">📎</div>
              <p className="text-sm font-medium text-purple-700">Drop your file here</p>
              <p className="text-xs text-purple-600">Images and audio files welcome</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Text Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              className={`w-full rounded-xl border px-4 py-3 outline-none resize-none transition-all
                ${isExpanded || body.length > 0 ? 'min-h-[100px]' : 'min-h-[60px]'}
                ${dragActive ? 'border-purple-300' : 'border-gray-300'}
                focus:ring-2 focus:ring-purple-300 focus:border-purple-300
                ${isOverLimit ? 'border-red-300 focus:ring-red-300' : ''}
              `}
              placeholder={isExpanded ? "Share your legal insights, study breakthroughs, questions, or words of encouragement with fellow Durham Law students..." : "What legal wisdom would you like to share today?"}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (!isExpanded) setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              maxLength={MAX_BODY}
            />
            
            {/* Character count indicator */}
            {isExpanded && (
              <div className="absolute bottom-3 right-3 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  isOverLimit ? 'bg-red-100 text-red-600' :
                  isNearLimit ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {charCount}/{MAX_BODY}
                </span>
              </div>
            )}
          </div>

          {/* Attachments */}
          {(imgPreview || audioFile) && (
            <div className="space-y-3">
              {imgPreview && (
                <div className="relative group">
                  <div className="relative inline-block">
                    <img 
                      src={imgPreview} 
                      alt="Preview" 
                      className="rounded-lg border max-h-64 w-auto shadow-sm" 
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {audioFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🎵</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={removeAudio}
                    className="h-6 w-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove audio"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {warn && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <span>⚠️</span>
              <span>{warn}</span>
            </div>
          )}

          {/* Controls */}
          {isExpanded && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 3 * 1024 * 1024) {
                        setWarn("Image must be smaller than 3 MB");
                        return;
                      }
                      setImgFile(f);
                      setImgPreview(URL.createObjectURL(f));
                      setWarn(null);
                    }}
                  />
                  <span>📷</span>
                  <span>Image</span>
                </label>

                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                  <input
                    type="file"
                    accept="audio/webm,audio/m4a,audio/mp4,audio/mpeg,audio/ogg,audio/wav"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 2 * 1024 * 1024) {
                        setWarn("Audio must be smaller than 2 MB");
                        return;
                      }
                      setAudioFile(f);
                      setWarn(null);
                    }}
                  />
                  <span>🎤</span>
                  <span>Audio</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                {(body.trim() || imgFile || audioFile) && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={posting}
                  >
                    Cancel
                  </button>
                )}
                
                <button
                  onClick={submit}
                  disabled={posting || (!body.trim() && !imgFile && !audioFile) || isOverLimit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {posting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <span>💜</span>
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
    </>
  );
}
