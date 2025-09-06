"use client";
import React, { useState, useEffect } from "react";

const moods = [
  { label: "Calm", color: "from-cyan-50 via-blue-50 to-teal-100" },
  { label: "Focus", color: "from-yellow-50 via-lime-50 to-green-100" },
  { label: "Social", color: "from-pink-50 via-rose-50 to-orange-100" },
];

const localStorageKey = "loungeMoodMode";

const MoodToggle: React.FC = () => {
  const [active, setActive] = useState(moods[0].label);

  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(localStorageKey);
      if (stored && moods.some((m) => m.label === stored)) {
        setActive(stored);
      }
    }
  }, []);

  useEffect(() => {
    // Only access document.body and localStorage in the browser environment
    if (typeof window !== 'undefined') {
      if (document.body) {
        document.body.setAttribute("data-lounge-mood", active);
      }
      if (window.localStorage) {
        localStorage.setItem(localStorageKey, active);
      }
    }
  }, [active]);

  return (
    <div className="bg-gradient-to-tr from-blue-50 via-purple-50 to-yellow-100 rounded-2xl shadow px-4 py-3 mb-2">
      <h3 className="font-bold text-lg">🎨 Mood</h3>
      <div className="mt-2 flex justify-between gap-2">
        {moods.map((m) => (
          <button
            key={m.label}
            aria-label={`Set mood: ${m.label}`}
            className={`flex-1 px-4 py-1 rounded-xl font-semibold transition border
              ${
                active === m.label
                  ? "bg-gradient-to-br " +
                    m.color +
                    " border-blue-400"
                  : "bg-white/80 hover:bg-gray-50 border-gray-200"
              }
            `}
            onClick={() => setActive(m.label)}
            tabIndex={0}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Accent and aura adapt to your vibe!
      </div>
    </div>
  );
};

export default MoodToggle;
