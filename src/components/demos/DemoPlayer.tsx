import React, { useState, useEffect } from "react";
import { DemoVideo } from "@/content/demoVideos";
import { DemoModal } from "./DemoModal";
import { DemoDock } from "./DemoDock";

interface DemoPlayerProps {
  video?: DemoVideo;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export const DemoPlayer: React.FC<DemoPlayerProps> = (props) => {
  // Determine screen size (Hydration safe)
  const [isDesktop, setIsDesktop] = useState(false);

  // Internal state for uncontrolled usage (e.g. click trigger)
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Derived state
  const isControlled = typeof props.isOpen !== "undefined";
  const isOpen = isControlled ? props.isOpen : internalIsOpen;

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 768); // md breakpoint
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleClose = () => {
    if (props.onClose) props.onClose();
    if (!isControlled) setInternalIsOpen(false);
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  // Render Trigger if specific
  if (!isOpen && props.trigger) {
    return (
      <div onClick={handleOpen} className="cursor-pointer inline-block">
        {props.trigger}
      </div>
    );
  }

  if (!isOpen) return null;

  if (isDesktop) {
    return (
      <DemoDock video={props.video} isOpen={isOpen} onClose={handleClose} />
    );
  }

  return <DemoModal {...props} isOpen={isOpen} onClose={handleClose} />;
};
