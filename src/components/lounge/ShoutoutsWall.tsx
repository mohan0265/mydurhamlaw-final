import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Shoutout {
  name: string;
  message: string;
  time: string;
}

const initialShoutouts: Shoutout[] = [
  { name: "Anonymous", message: "Brian explained a tough topic in chat – legend! 💡", time: "today" },
  { name: "Orla", message: "Sam always shares his notes with everyone.", time: "yesterday" },
];

const ShoutoutsWall: React.FC = () => {
  const [shoutouts, setShoutouts] = useState(initialShoutouts);
  const [msg, setMsg] = useState("");

  function send() {
    if (!msg.trim()) return;
    setShoutouts([{ name: "Anonymous", message: msg, time: "just now" }, ...shoutouts]);
    setMsg("");
  }

  return (
    <div className="bg-gradient-to-br from-blue-100 via-green-100 to-green-50 rounded-2xl shadow px-4 py-3 mb-4">
      <h3 className="font-bold text-lg mb-1">👏 Shoutouts Wall</h3>
      <input
        type="text"
        className="w-full rounded-lg p-2 border border-gray-200 mb-2 text-sm"
        value={msg}
        placeholder="Give kudos to a friend, teacher, or random act…"
        onChange={e => setMsg(e.target.value)}
        onKeyDown={e => (e.key === "Enter" ? (e.preventDefault(), send()) : undefined)}
        aria-label="Shoutout message"
      />
      <Button size="sm" disabled={!msg.trim()} onClick={send} className="mb-2">Send</Button>
      <ul className="max-h-32 overflow-y-auto flex flex-col gap-1 text-[13px]">
        {shoutouts.map((s, i) => (
          <li key={i}><b>{s.name}:</b> {s.message} <span className="text-gray-400 text-[11px]">({s.time})</span></li>
        ))}
      </ul>
    </div>
  );
};

export default ShoutoutsWall;
