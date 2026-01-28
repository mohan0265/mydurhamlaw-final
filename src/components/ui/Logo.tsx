"use client";
import React, { useState, useEffect } from "react";

import Link from "next/link";
// import { GoldScaleIcon } from './GoldScaleIcon' // Removed

interface LogoProps {
  variant?: "light" | "dark";
  showIcon?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

const GoldScaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100" // Generic square viewbox
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Roof */}
    <path d="M50 10 L90 40 H10 Z" fill="#C9A227" />
    {/* Top Bar */}
    <rect x="10" y="40" width="80" height="10" fill="#C9A227" />
    {/* Pillars */}
    <rect x="15" y="55" width="10" height="30" fill="#C9A227" />
    <rect x="35" y="55" width="10" height="30" fill="#C9A227" />
    <rect x="55" y="55" width="10" height="30" fill="#C9A227" />
    <rect x="75" y="55" width="10" height="30" fill="#C9A227" />
    {/* Base */}
    <rect x="5" y="85" width="90" height="10" fill="#C9A227" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  variant = "light",
  showIcon = true,
  showText = true,
  size = "md",
  className = "",
  href = "/",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          icon: "h-6 w-6",
          text: "text-lg",
          spacing: "ml-2",
        };
      case "lg":
        return {
          icon: "h-12 w-12",
          text: "text-3xl",
          spacing: "ml-4",
        };
      default:
        return {
          icon: "h-10 w-10",
          text: "text-2xl",
          spacing: "ml-3",
        };
    }
  };

  const getTextClasses = () => {
    if (variant === "dark") {
      return {
        text: "text-[#5B2AAE]", // Academic Purple for Light Mode (Dark Text)
        highlight: "text-[#C9A227]", // Muted Gold
      };
    } else {
      // Light Variant (for Dark backgrounds) matches request
      return {
        text: "text-gray-900 dark:text-white", // Adaptive
        highlight: "text-[#C9A227]",
      };
    }
  };

  const sizeClasses = getSizeClasses();
  // const textClasses = getTextClasses(); // Logic refactored to specific colors

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      {/* Logo Icon */}
      {showIcon && (
        <div
          className={`relative ${sizeClasses.spacing === "ml-3" ? "mr-3" : "mr-2"} shrink-0`}
        >
          <GoldScaleIcon className={sizeClasses.icon} />
        </div>
      )}

      {/* Branded Wordmark - Font Adjustments */}
      {showText && (
        <div className="flex flex-col justify-center">
          {/* Main Text */}
          <span
            className={`${sizeClasses.text} font-black tracking-tight leading-none text-gray-900 dark:text-white`}
            style={{
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            Caseway
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

// ... keep existing hooks
export const useLogoVariant = (routePath?: string): "light" | "dark" => {
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = routePath || window.location.pathname;
      setCurrentPath(path);
    }
  }, [routePath]);

  useEffect(() => {
    const lightBackgroundPages = [
      "/onboarding",
      "/signup",
      "/login",
      "/complete-profile",
      "/settings",
      "/legal",
      "/about",
      "/ethics",
      "/terms-of-use",
      "/privacy-policy",
      "/study-materials",
      "/assignments",
      "/study-schedule",
      "/calendar",
      "/research-hub",
      "/tools",
    ];

    const isLightBackground = lightBackgroundPages.some((page) =>
      currentPath.startsWith(page),
    );

    setVariant(isLightBackground ? "dark" : "light");
  }, [currentPath]);

  return variant;
};

export default Logo;
