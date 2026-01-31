import { useState, useEffect } from "react";
import { isDemoMode } from "@/lib/demo";

export function useDemoMode() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check on mount to access window/URL params
    setIsDemo(isDemoMode());
  }, []);

  return isDemo;
}
