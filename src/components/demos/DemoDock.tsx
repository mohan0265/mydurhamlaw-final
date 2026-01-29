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
  MoveDiagonal,
} from "lucide-react";
import { DemoVideo } from "@/content/demoVideos";

interface DemoDockProps {
  video?: DemoVideo;
  isOpen: boolean;
  onClose: () => void;
}

export const DemoDock: React.FC<DemoDockProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  if (!video) return null;

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 250 }); // Track size explicitly
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Initial positioning: Bottom Right by default
  useEffect(() => {
    if (isOpen) {
      const { innerWidth, innerHeight } = window;
      setPosition({ x: innerWidth - 440, y: innerHeight - 340 });
    }
  }, [isOpen]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Resize Handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Moving
      if (isDragging && dragStartRef.current) {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;

        const clampedX = Math.max(0, Math.min(window.innerWidth - 50, newX));
        const clampedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

        setPosition({ x: clampedX, y: clampedY });
      }

      // Resizing
      if (isResizing && resizeStartRef.current) {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        const newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
        const newHeight = Math.max(200, resizeStartRef.current.height + deltaY);

        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 p-3 bg-gray-900 border border-white/20 rounded-full shadow-2xl cursor-pointer hover:bg-gray-800 transition-colors"
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
        width: size.width,
        height: size.height,
      }}
      className="fixed z-[9999] bg-gray-900 rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header (Draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className={`bg-gray-800 p-3 flex justify-between items-center cursor-move select-none shrink-0 border-b border-white/5 ${
          isDragging ? "cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-white/80 overflow-hidden">
          <GripHorizontal size={16} className="shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider truncate">
            {video.title}
          </span>
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-black relative overflow-hidden">
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

      {/* Resize Handle (Custom) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-white/10 rounded-tl-lg z-50 text-gray-500 hover:text-white transition-colors"
      >
        <MoveDiagonal size={16} />
      </div>
    </div>
  );
};

// Reusing the CarouselPlayer logic (lightweight version for Dock)
const CarouselPlayer: React.FC<{ video: DemoVideo }> = ({ video }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // FIX: Map steps to frames if frames is empty
  const frames =
    video.frames && video.frames.length > 0
      ? video.frames
      : video.steps?.map((s) => s.src) || [];

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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs p-8 text-center bg-gray-900 via-gray-800 to-gray-900">
        <p className="mb-2 font-bold text-gray-400">Demo Coming Soon</p>
        <p className="opacity-50">No frames available for {video.title}</p>
      </div>
    );

  return (
    <div className="relative w-full h-full group bg-black flex items-center justify-center">
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
      <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/90 to-transparent pt-8">
        <button
          onClick={() =>
            setCurrentIndex(
              (prev) => (prev - 1 + frames.length) % frames.length,
            )
          }
          className="p-1.5 bg-white/10 backdrop-blur text-white rounded-full hover:bg-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
        >
          {isPlaying ? (
            <Pause size={12} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % frames.length)}
          className="p-1.5 bg-white/10 backdrop-blur text-white rounded-full hover:bg-indigo-600 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
