"use client";
import React, { useState, useEffect } from "react";
import NextImage from "next/image";
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
          spacing: "ml-1",
        };
      case "lg":
        return {
          icon: "h-12 w-12",
          text: "text-2xl",
          spacing: "ml-3",
        };
      default:
        return {
          icon: "h-10 w-10",
          text: "text-xl",
          spacing: "ml-2",
        };
    }
  };

  const getTextClasses = () => {
    if (variant === "dark") {
      return {
        text: "text-[#5B2AAE]", // Academic Purple
        highlight: "text-[#C9A227]", // Muted Gold
      };
    } else {
      return {
        text: "text-white",
        highlight: "text-[#C9A227]", // Gold on dark
      };
    }
  };

  const sizeClasses = getSizeClasses();
  const textClasses = getTextClasses();

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      {/* Logo Icon */}
      {showIcon && (
        <div className="relative mr-3">
          <NextImage
            src={
              variant === "dark"
                ? "/brand/logo-icon.svg"
                : "/brand/logo-icon-white.svg"
            }
            alt="Logo"
            width={size === "sm" ? 24 : size === "lg" ? 48 : 40}
            height={size === "sm" ? 24 : size === "lg" ? 48 : 40}
            className="object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}

      {/* Branded Wordmark */}
      {showText && (
        <div className={""}>
          <div
            className={`${sizeClasses.text} font-bold tracking-tight flex items-baseline gap-[1px]`}
          >
            <span className={textClasses.text}>Case</span>
            <span className={textClasses.highlight}>way</span>
          </div>
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

// Helper hook to determine logo variant based on current route or theme
export const useLogoVariant = (routePath?: string): "light" | "dark" => {
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    // Only access window.location inside useEffect hook for SSR safety
    if (typeof window !== "undefined") {
      const path = routePath || window.location.pathname;
      setCurrentPath(path);
    }
  }, [routePath]);

  useEffect(() => {
    // Pages with light/white backgrounds should use dark logo
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

    // Check if current path starts with any light background page
    const isLightBackground = lightBackgroundPages.some((page) =>
      currentPath.startsWith(page),
    );

    setVariant(isLightBackground ? "dark" : "light");
  }, [currentPath]);

  return variant;
};

export default Logo;
