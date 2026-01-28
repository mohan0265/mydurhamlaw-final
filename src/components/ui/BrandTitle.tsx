"use client";

import React from "react";

interface BrandTitleProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
}

/**
 * Reusable BrandTitle component for consistent Caseway styling
 */
export const BrandTitle: React.FC<BrandTitleProps> = ({
  variant = "light",
  size = "md",
  className = "",
  as: Component = "span",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "md":
        return "text-base";
      case "lg":
        return "text-lg";
      case "xl":
        return "text-xl";
      case "2xl":
        return "text-2xl";
      case "3xl":
        return "text-3xl";
      case "4xl":
        return "text-4xl";
      default:
        return "text-base";
    }
  };

  const getColorClasses = () => {
    if (variant === "dark") {
      return {
        text: "text-white",
        highlight: "text-teal-400",
      };
    } else {
      return {
        text: "text-gray-900",
        highlight: "text-teal-600",
      };
    }
  };

  const sizeClasses = getSizeClasses();
  const colorClasses = getColorClasses();

  return (
    <Component
      className={`${sizeClasses} font-bold tracking-wide ${className}`}
    >
      <span className={colorClasses.text}>Case</span>
      <span className={colorClasses.highlight}>way</span>
    </Component>
  );
};

export default BrandTitle;
