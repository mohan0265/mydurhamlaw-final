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
  const [shouldPersist, setShouldPersist] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { user } = useAuth();

  // Custom styles to match Caseway branding
  const [tourWidth, setTourWidth] = useState<string | number>(400);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTourWidth("90vw");
    }
  }, []);

  const styles: any = {
    options: {
      primaryColor: "#4f46e5", // Indigo-600
      zIndex: 10000,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      width: tourWidth,
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
    const isGuest = !user && currentPath === "/";

    if (finishedStatuses.includes(status) || type === EVENTS.TOUR_END) {
      setRun(false);
      setStepIndex(0);

      // NUCLEAR SUPPRESSION: If "Don't show again" was checked, disable auto-launch FOREVER
      // We do this even if they just closed the tour by clicking X or Skip
      if (shouldPersist) {
        console.log(
          "[Tour] Suppressing all tours permanently per user request",
        );
        localStorage.setItem("caseway_tours_disabled_all", "true");
        // Also set specific keys for redundancy
        localStorage.setItem("tour_home_autolaunch_disabled", "true");
        localStorage.setItem("tour_student_autolaunch_disabled", "true");
      }
    }
  };

  const handleAutoStart = useCallback(() => {
    if (run) return; // Already running

    let targetTour: "guest" | "dashboard" | null = null;
    let isDisabled = false;

    // GUEST TOUR: Only on landing page "/", not logged in
    if (currentPath === "/" && !user) {
      targetTour = "guest";
      isDisabled =
        localStorage.getItem("tour_home_autolaunch_disabled") === "true";
    }
    // DASHBOARD TOUR: On /dashboard, logged in
    else if (currentPath === "/dashboard" && user) {
      targetTour = "dashboard";
      isDisabled =
        localStorage.getItem("tour_student_autolaunch_disabled") === "true";
    }

    const isAllDisabled =
      localStorage.getItem("caseway_tours_disabled_all") === "true";

    if (targetTour && !isDisabled && !isAllDisabled) {
      startTour(targetTour);
    }
  }, [currentPath, user, run]);

  return (
    <TourContext.Provider
      value={{ startTour, stopTour, isRunning: run, setShouldPersist }}
    >
      {isMounted && (
        <Joyride
          steps={steps}
          run={run}
          stepIndex={stepIndex}
          continuous
          showProgress
          showSkipButton
          disableOverlayClose={true}
          spotlightClicks={true}
          disableBeacon={true} // GLOBALLY DISABLE BEACONS (The "glowing circle")
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
      )}
      {children}
    </TourContext.Provider>
  );
};
