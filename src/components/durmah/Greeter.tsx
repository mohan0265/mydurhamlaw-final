// src/components/durmah/Greeter.tsx
import React from "react";
import { useDurmah, yearLabel } from "@/lib/durmah/context";
import {
  defaultMonthDeepLink,
  weekOneLink,
  formatTodayForDisplay,
} from "@/lib/durmah/phase";

export default function Greeter() {
  const ctx = useDurmah();
  const { firstName, yearKey, daysUntil, keyDates } = ctx;

  const openMonth = () => {
    const href = defaultMonthDeepLink(
      yearKey,
      new Date().toISOString().slice(0, 10),
      keyDates
    );
    window.location.href = href;
  };

  const openWeekOne = () => {
    const href = weekOneLink(yearKey, keyDates);
    window.location.href = href;
  };

  const addRoutine = () => {
    window.location.href = "/routines/new?template=daily-study";
  };

  const todayFriendly = formatTodayForDisplay("Europe/London");

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-1">Durmah</div>
      <h2 className="text-xl font-semibold mb-2">Hi {firstName} 👋</h2>
      <p className="text-gray-700 leading-relaxed">
        You’re {yearLabel(yearKey)} LLB (AY 2025/26).<br />
        Today is {todayFriendly} — {daysUntil.induction} days to Induction (29
        Sep) and {daysUntil.teachingStart} days to Michaelmas teaching (6 Oct).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={openMonth}
          className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
        >
          Open October month view
        </button>
        <button
          onClick={openWeekOne}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition"
        >
          Week&nbsp;1 prep checklist
        </button>
        <button
          onClick={addRoutine}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition"
        >
          Add a daily routine
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Logic runs in Europe/London; display may use your local settings.
      </p>
    </div>
  );
}
