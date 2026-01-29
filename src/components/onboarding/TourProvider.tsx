import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  Step,
  Styles,
  EVENTS,
} from "react-joyride";
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
  const [stepIndex, setStepIndex] = useState(0);
  const [shouldPersist, setShouldPersist] = useState(true);

  const router = useRouter();
  const { user } = useAuth();

  // Custom styles to match Caseway branding
  const styles: any = {
    options: {
      primaryColor: "#4f46e5", // Indigo-600
      zIndex: 10000,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      width:
        typeof window !== "undefined" && window.innerWidth < 768 ? "90vw" : 400,
    },
    spotlight: {
      borderRadius: "16px",
    },
    tooltip: {
      borderRadius: "16px",
    },
    buttonNext: {
      backgroundColor: "#4f46e5",
      borderRadius: "8px",
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
    const { action, index, status, type } = data;

    // Track step index changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === "prev" ? -1 : 1));
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0); // Reset for next time
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
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose={true}
        spotlightClicks={true}
        callback={handleJoyrideCallback}
        styles={styles}
        tooltipComponent={TourTooltip}
        spotlightPadding={10}
        scrollOffset={100}
        scrollToFirstStep={true}
        floaterProps={{
          hideArrow: false,
          disableAnimation: true,
        }}
      />
      {children}
    </TourContext.Provider>
  );
};
