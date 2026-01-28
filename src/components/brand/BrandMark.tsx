import React from "react";
import NextImage from "next/image";

type BrandMarkProps = {
  variant?: "header" | "footer";
};

export const BrandMark: React.FC<BrandMarkProps> = ({ variant = "header" }) => {
  // Config based on variant
  // Using Caseway assets from public/brand/caseway/
  // header: caseway-logo.svg (assuming color or appropriate for header)
  // footer: caseway-logo-dark.svg (assuming white/light for dark footer)

  // Actually, standard practice:
  // Light bg -> Color logo (caseway-logo.svg)
  // Dark bg -> White/Light logo (caseway-logo-dark.svg or similar)

  // Warning: The user prompt said:
  // For header: use caseway-logo.svg
  // For footer: use caseway-logo-dark.svg

  const logoSrc =
    variant === "header"
      ? "/brand/caseway/caseway-logo.svg"
      : "/brand/caseway/caseway-logo-dark.svg";

  const width = variant === "header" ? 140 : 160;
  const height = variant === "header" ? 40 : 48;

  return (
    <div
      className={`relative flex items-center ${variant === "footer" ? "opacity-90 hover:opacity-100" : ""}`}
    >
      <NextImage
        src={logoSrc}
        alt="Caseway"
        width={width}
        height={height}
        className="object-contain h-auto w-auto"
        priority
      />
    </div>
  );
};
