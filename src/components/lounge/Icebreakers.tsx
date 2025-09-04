"use client";
import React from "react";
import { Button } from "@/components/ui/Button";

const prompts = [
  "What tiny win did you have today?",
  "One tip that helped you in contracts?",
  "Share a cozy study nook near campus?",
  "What's your best memory at Durham so far?",
  "Who's your legal role model?",
  "What's the best café for revision fuel?",
  "Most unusual study habit?",
];

interface IcebreakersProps {
  onPick: (prompt: string) => void;
}

const Icebreakers: React.FC<IcebreakersProps> = ({ onPick }) => (
  <div className="bg-gradient-to-br from-yellow-100/50 to-pink-100/50 rounded-2xl shadow-md px-4 py-3 mb-2 flex flex-col gap-2">
    <h3 className="font-bold text-lg">🧊 Icebreakers</h3>
    <div className="flex flex-wrap gap-2 mt-1">
      {prompts.map((p) => (
        <Button
          key={p}
          size="sm"
          variant="outline"
          className="rounded-xl text-sm border-blue-200 hover:bg-blue-50"
          onClick={() => onPick(p)}
        >
          {p}
        </Button>
      ))}
    </div>
  </div>
);

export default Icebreakers;
