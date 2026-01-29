import React from "react";
import { HelpCircle } from "lucide-react";
import { useTour } from "./TourProvider";
import { useRouter } from "next/router";

export const TourHelpButton: React.FC = () => {
  const { startTour, isRunning } = useTour();
  const router = useRouter();

  // Only show on relevant pages
  const isLanding = router.pathname === "/";
  const isDashboard = router.pathname === "/dashboard";

  if (!isLanding && !isDashboard) return null;
  if (isRunning) return null;

  // Logged-out logic: Hide floating reminder if they dismissed it (checked "don't show again")
  // They can still use the footer link.
  if (isLanding) {
    const disabled =
      typeof window !== "undefined" &&
      localStorage.getItem("tour_home_autolaunch_disabled") === "true";
    if (disabled) return null;
  }

  const handleRestart = () => {
    if (isLanding) startTour("guest");
    if (isDashboard) startTour("dashboard");
  };

  return (
    <button
      onClick={handleRestart}
      className="fixed bottom-4 right-20 z-40 p-2 bg-white/10 hover:bg-white/20 text-gray-500 hover:text-white rounded-full transition-all shadow-sm backdrop-blur-sm border border-white/10 group"
      title="Need a quick walkthrough?"
      aria-label="Replay Tour"
    >
      <HelpCircle size={20} />
    </button>
  );
};
