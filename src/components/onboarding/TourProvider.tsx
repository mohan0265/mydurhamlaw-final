import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Joyride, { CallBackProps, STATUS, Step, Styles } from "react-joyride";
import { useRouter } from "next/router";
import { GUEST_TOUR_STEPS, STUDENT_DASHBOARD_TOUR_STEPS } from "./tours";
import { useAuth } from "@/lib/supabase/AuthContext";
import { TourTooltip } from "./TourTooltip";

type TourContextType = {
  startTour: (tourName: "guest" | "dashboard") => void;
  stopTour: () => void;
  isRunning: boolean;
  setShouldPersist: (val: boolean) => void;
};

const TourContext = createContext<TourContextType>({
  startTour: () => {},
  stopTour: () => {},
  isRunning: false,
  setShouldPersist: () => {},
});

export const useTour = () => useContext(TourContext);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tourKey, setTourKey] = useState<string>("");
  const [shouldPersist, setShouldPersist] = useState(true);

  const router = useRouter();
  const { user } = useAuth();

  // Custom styles to match Caseway branding
  const styles: any = {
    options: {
      primaryColor: "#4f46e5", // Indigo-600
      zIndex: 10000,
      overlayColor: "rgba(0, 0, 0, 0.6)", // Slightly darker for focus
    },
    spotlight: {
      borderRadius: "16px", // Smooth rounded corners
    },
  };

  const currentPath = router.pathname;

  // Auto-start logic
  useEffect(() => {
    // Wait for mount
    const timer = setTimeout(() => {
      handleAutoStart();
    }, 1500); // Slight delay for UI to settle
    return () => clearTimeout(timer);
  }, [currentPath, user]);

  const handleAutoStart = useCallback(() => {
    if (run) return; // Already running

    let targetTour: "guest" | "dashboard" | null = null;
    let storageKey = "";

    // GUEST TOUR: Only on landing page "/", not logged in
    if (currentPath === "/" && !user) {
      targetTour = "guest";
      storageKey = "caseway_tour_done_guest_v1";
    }
    // DASHBOARD TOUR: On /dashboard, logged in
    else if (currentPath === "/dashboard" && user) {
      targetTour = "dashboard";
      storageKey = `caseway_tour_done_dashboard_v1_${user.id}`;
    }

    if (targetTour && storageKey) {
      const isDone = localStorage.getItem(storageKey);
      if (!isDone) {
        setShouldPersist(true); // Default to saving
        startTour(targetTour);
      }
    }
  }, [currentPath, user, run]);

  const startTour = (tourName: "guest" | "dashboard") => {
    if (tourName === "guest") {
      setSteps(GUEST_TOUR_STEPS);
      setTourKey("caseway_tour_done_guest_v1");
    } else if (tourName === "dashboard") {
      setSteps(STUDENT_DASHBOARD_TOUR_STEPS);
      setTourKey(user ? `caseway_tour_done_dashboard_v1_${user.id}` : "");
    }
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Inject pulse animation class to target
    if (data.type === "step:after" || data.type === "tour:start") {
      // Remove from prev
      document
        .querySelectorAll(".tour-highlight-pulse")
        .forEach((el) => el.classList.remove("tour-highlight-pulse"));

      // Add to current (Wait for dom update)
      setTimeout(() => {
        const target = document.querySelector(data.step.target as string);
        if (target) {
          target.classList.add("tour-highlight-pulse");
          // Ensure relative positioning if not fixed, so shadow isn't clipped?
          // Actually box-shadow usually works fine.
        }
      }, 100);
    }
    if (finishedStatuses.includes(status)) {
      // Clean up
      document
        .querySelectorAll(".tour-highlight-pulse")
        .forEach((el) => el.classList.remove("tour-highlight-pulse"));

      setRun(false);
      // Mark as done ONLY if shouldPersist is true
      if (tourKey && shouldPersist) {
        localStorage.setItem(tourKey, "true");
      }
    }
  };

  return (
    <TourContext.Provider
      value={{ startTour, stopTour, isRunning: run, setShouldPersist }}
    >
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose={true} // Force user to interact with tour controls
        spotlightClicks={true}
        callback={handleJoyrideCallback}
        styles={styles}
        tooltipComponent={TourTooltip}
        spotlightPadding={14} // Target 12-18px
        scrollOffset={100} // Smooth scroll offset
        scrollToFirstStep={true}
        floaterProps={{
          hideArrow: false,
          disableAnimation: true, // We handle animation in CSS
        }}
      />
      {children}
    </TourContext.Provider>
  );
};
