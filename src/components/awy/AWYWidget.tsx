// src/components/awy/AWYWidget.tsx
import toast from "react-hot-toast";

interface Position {
  x: number;
  y: number;
}

function ringClass(status?: "online" | "offline" | "busy") {
  if (status === "busy") return "ring-amber-400";
  if (status === "online") return "ring-green-500";
  return "ring-gray-400 opacity-60";
}

// 👉 default now: bottom-right, 88px from right, 180px from bottom (above Durmah mic)
function computeBottomRight(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const widgetWidth = 64;   // collapsed
  const safeRight = 88;     // leave room for mic button
  const safeBottom = 180;   // sit above mic
  return { x: Math.max(16, w - widgetWidth - safeRight), y: Math.max(16, h - safeBottom) };
}

function getLastPosition(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  try {
    const saved = localStorage.getItem("awyWidget:position");
    return saved ? JSON.parse(saved) : computeBottomRight();
  } catch { return computeBottomRight(); }
}

function savePosition(position: Position) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("awyWidget:position", JSON.stringify(position)); } catch {}
}

export default function AWYWidget() {
  const {
    userId,
    connections,
    presenceByUser,
    sendWave,
    callLinks,
    wavesUnread,
    wavesUnreadRef,
    linkLovedOneByEmail,
  } = useAwyPresence();

  const [position, setPosition] = useState<Position>({ x: 16, y: 16 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Set position from getLastPosition() inside useEffect for SSR safety
  useEffect(() => {
    const pos = getLastPosition();
    setPosition(pos);
  }, []);

  // feature flag + auth
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== "1") return null;
  if (!userId) return null;

  // presence transition toast
  const prevPresenceRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const prev = prevPresenceRef.current;
    const next = new Map<string, string>();
    for (const c of connections) {
      const status = presenceByUser.get(c.loved_one_id)?.status ?? "offline";
      next.set(c.loved_one_id, status);
      const prevStatus = prev.get(c.loved_one_id) ?? "offline";
      if (status === "online" && prevStatus !== "online") {
        toast.success(`${c.relationship} is now online`, { icon: "💚", duration: 2200 });
      }
    }
    prevPresenceRef.current = next;
  }, [connections, presenceByUser]);

  // wave received toast
  useEffect(() => {
    if (wavesUnread > (wavesUnreadRef?.current ?? 0)) {
      toast("👋 Wave received!", { icon: "👋", duration: 1800 });
    }
  }, [wavesUnread, wavesUnreadRef]);
