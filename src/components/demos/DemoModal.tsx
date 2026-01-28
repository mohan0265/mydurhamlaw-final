import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Pause,
} from "lucide-react";
import { DemoVideo } from "@/content/demoVideos";

// Simple raw modal since Radix is not installed
// Using a Portal style overlay.

interface DemoPlayerProps {
  video: DemoVideo;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export const DemoModal: React.FC<DemoPlayerProps> = ({
  video,
  trigger,
  isOpen: externalIsOpen,
  onClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (isControlled) return;
    setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalIsOpen(false);
  };

  if (!isOpen && trigger) {
    return (
      <div onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10 m-4">
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <h3 className="text-white font-bold text-lg drop-shadow-md">
              {video.title}
            </h3>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Content */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          {video.type === "video" && video.src ? (
            <video
              src={video.src}
              poster={video.poster}
              autoPlay
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <CarouselPlayer video={video} />
          )}
        </div>
      </div>
    </div>
  );
};

// Carousel Sub-component
const CarouselPlayer: React.FC<{ video: DemoVideo }> = ({ video }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frames = video.frames || [];
  const hasFrames = frames.length > 0;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasFrames || !isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, 3000); // 3 seconds per slide

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasFrames, isPlaying, frames.length]);

  if (!hasFrames) {
    return (
      <div className="flex flex-col items-center gap-4 text-white/50">
        <img
          src={video.poster}
          alt="Poster"
          className="w-64 opacity-50 rounded"
        />
        <p>Preview loading...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <img
        src={frames[currentIndex]}
        alt={`Step ${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/50 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / frames.length) * 100}%` }}
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={() =>
            setCurrentIndex(
              (prev) => (prev - 1 + frames.length) % frames.length,
            )
          }
          className="p-2 text-white hover:bg-white/20 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % frames.length)}
          className="p-2 text-white hover:bg-white/20 rounded-full"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
