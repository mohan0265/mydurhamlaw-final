import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Joyride, { CallBackProps, STATUS, Step, Styles } from "react-joyride";
import { usePathname } from "next/navigation"; // App router or works in Pages too usually? check compat.
import { useRouter } from "next/router";
import { GUEST_TOUR_STEPS, STUDENT_DASHBOARD_TOUR_STEPS } from "./tours";
import { useAuth } from "@/lib/supabase/AuthContext";

type TourContextType = {
  startTour: (tourName: "guest" | "dashboard") => void;
  stopTour: () => void;
  isRunning: boolean;
};

const TourContext = createContext<TourContextType>({
  startTour: () => {},
  stopTour: () => {},
  isRunning: false,
});

export const useTour = () => useContext(TourContext);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tourKey, setTourKey] = useState<string>("");

  const router = useRouter();
  const { user } = useAuth();

  // Custom styles to match Caseway branding
  const styles: any = {
    options: {
      primaryColor: "#0f172a", // Dark slate / elegant
      textColor: "#334155",
      backgroundColor: "#ffffff",
      arrowColor: "#ffffff",
      zIndex: 10000,
      overlayColor: "rgba(0, 0, 0, 0.5)",
    },
    buttonNext: {
      backgroundColor: "#111827",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: 600,
      padding: "8px 16px",
    },
    buttonBack: {
      color: "#6b7280",
      marginRight: 10,
      fontSize: "14px",
    },
    tooltip: {
      borderRadius: "8px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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

    // GUEST TOUR: Only on landing page "/", not logged in (or explicitly logged out logic)
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
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      // Mark as done
      if (tourKey) {
        localStorage.setItem(tourKey, "true");
      }
    }
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour, isRunning: run }}>
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
        locale={{
          last: "Finish",
          skip: "Skip Tour",
        }}
      />
      {children}
    </TourContext.Provider>
  );
};
