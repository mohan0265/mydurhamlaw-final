"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";

interface LogoProps {
  variant?: "light" | "dark";
  showIcon?: boolean; // Kept for API compatibility, but full logo preferred
  showText?: boolean; // Kept for API compatibility
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
  const getSizeDimensions = () => {
    switch (size) {
      case "sm":
        return { width: 120, height: 32 };
      case "lg":
        return { width: 200, height: 53 };
      default:
        return { width: 150, height: 40 }; // md
    }
  };

  const { width, height } = getSizeDimensions();

  // Logic:
  // variant='light' usually means "Logo for light background" -> dark text -> caseway-logo-dark.svg
  // variant='dark' usually means "Logo for dark background" -> light text -> caseway-logo.svg
  // Re-reading user intent: "Light mode: caseway-logo.svg (primary)", "Dark mode: caseway-logo-dark.svg".
  // Wait, typically "caseway-logo.svg" is color/teal text (for light bg), "caseway-logo-dark.svg" is white text (for dark bg).
  // Let's assume standard naming convention:
  // - caseway-logo.svg (Primary/Color) -> For Light Mode backgrounds (White/Off-white)
  // - caseway-logo-dark.svg (White/Light text) -> For Dark Mode backgrounds (Teal/Black)

  // The 'variant' prop usually describes the BACKGROUND it sits on, OR the theme.
  // Existing code: variant="light" -> text-gray-900 (Dark text). So variant="light" means "Light Mode" (Light BG, Dark Text).
  // Existing code: variant="dark" -> text-white. So variant="dark" means "Dark Mode" (Dark BG, Light Text).

  // Updated Assumption based on standard props:
  // variant='light' -> Light Mode -> Needs Dark/Color Logo -> /brand/caseway/caseway-logo.svg (Primary)
  // variant='dark' -> Dark Mode -> Needs White/Light Logo -> /brand/caseway/caseway-logo-dark.svg

  const logoSrc =
    variant === "dark" || variant === "dark-header" // Assuming "dark" means dark theme/bg
      ? "/brand/caseway/caseway-logo-dark.svg" // White/Light text logo for dark backgrounds
      : "/brand/caseway/caseway-logo.svg"; // Dark/Color text logo for light backgrounds

  // If specific parts are requested (icon/text only), we might need strict asset separation
  // But user said "Replace logo usage", implying full logo asset.
  // For safety, if showIcon=true and showText=true, we use the full lockup.
  // If only one is requested, we might fallback to generic text or icon if assets don't exist broken out.
  // The README said: "caseway-logo.svg" is the logo.

  const LogoContent = () => (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      <NextImage
        src={logoSrc}
        alt="Caseway"
        width={width}
        height={height}
        className="object-contain h-auto w-auto max-w-full"
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center" aria-label="Caseway Home">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

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
    // Pages with Dark Header or Dark Background used to use 'light' variant (legacy flip logic?)
    // Let's standardise:
    // If page has Light BG -> Return 'light' (Expects dark text logo)
    // If page has Dark BG -> Return 'dark' (Expects light text logo)

    // Pages with Dark Backgrounds (requiring White/Dark Mode Logo):
    const darkBackgroundPages = [
      "/dashboard",
      // Homepage hero often dark?
      // "/homepage" // if hero is dark
    ];

    // Logic from previous file reversed 'light'/'dark' naming slightly confusingly.
    // Let's stick to the prop meaning: variant="dark" -> Dark Theme Logo (White text).

    // Most pages are Light BG.
    // Dashboard might differ.
    // For now, default to 'light' (Primary Logo) unless explicitly dark.

    // Check if current path starts with dark pages
    const isDarkBg = darkBackgroundPages.some((p) => currentPath.startsWith(p));

    setVariant(isDarkBg ? "dark" : "light");
  }, [currentPath]);

  return variant;
};

export default Logo;
