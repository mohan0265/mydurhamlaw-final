import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Pause,
  GripHorizontal,
} from "lucide-react";
import { DemoVideo } from "@/content/demoVideos";

interface DemoDockProps {
  video: DemoVideo;
  isOpen: boolean;
  onClose: () => void;
}

export const DemoDock: React.FC<DemoDockProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Initial positioning: Bottom Right by default
  useEffect(() => {
    if (isOpen) {
      const { innerWidth, innerHeight } = window;
      setPosition({ x: innerWidth - 420, y: innerHeight - 320 }); // Approx size
    }
  }, [isOpen]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return; // Don't drag when minimized (simplification)
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[50] flex items-center gap-3 p-3 bg-gray-900 border border-white/20 rounded-full shadow-2xl cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-bold text-white max-w-[150px] truncate">
          {video.title}
        </span>
        <Maximize2 size={16} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div
      ref={dockRef}
      style={{
        left: position.x,
        top: position.y,
        width: "400px", // Initial width
        height: "auto",
      }}
      className="fixed z-[50] bg-gray-900 rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden min-w-[300px] min-h-[200px]"
    >
      {/* Resize Handle (CSS) - Hidden but enabled via css resize */}
      <style jsx>{`
        div {
          resize: both;
          overflow: hidden; /* Needed for resize to work */
        }
      `}</style>

      {/* Header (Draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className={`bg-gray-800 p-3 flex justify-between items-center cursor-move select-none ${isDragging ? "cursor-grabbing" : ""}`}
      >
        <div className="flex items-center gap-2 text-white/80">
          <GripHorizontal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[200px]">
            {video.title}
          </span>
        </div>
        <div
          className="flex items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"
            title="Minimize"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-black relative max-h-[80vh] overflow-hidden">
        {video.type === "video" && video.src ? (
          <video
            src={video.src}
            poster={video.poster}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <CarouselPlayer video={video} />
        )}
      </div>
    </div>
  );
};

// Reusing the CarouselPlayer logic (lightweight version for Dock)
const CarouselPlayer: React.FC<{ video: DemoVideo }> = ({ video }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frames = video.frames || []; // Should be injected from registry properly but falling back
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!frames.length || !isPlaying) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [frames.length, isPlaying]);

  if (!frames.length)
    return (
      <div className="text-white text-center p-8 text-xs">
        No frames available
      </div>
    );

  return (
    <div className="relative w-full h-full group bg-black aspect-video">
      <img
        src={frames[currentIndex]}
        alt={`Step ${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />

      {/* Progress */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / frames.length) * 100}%` }}
        />
      </div>

      {/* Floating Controls */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={() =>
            setCurrentIndex(
              (prev) => (prev - 1 + frames.length) % frames.length,
            )
          }
          className="p-1.5 bg-black/50 text-white rounded-full hover:bg-indigo-600"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-white text-black rounded-full hover:scale-110"
        >
          {isPlaying ? (
            <Pause size={12} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % frames.length)}
          className="p-1.5 bg-black/50 text-white rounded-full hover:bg-indigo-600"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
