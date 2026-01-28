import React from "react";
import NextImage from "next/image";

type BrandMarkProps = {
  variant?: "header" | "footer";
};

export const BrandMark: React.FC<BrandMarkProps> = ({ variant = "header" }) => {
  // Config based on variant
  const iconSize = variant === "header" ? 32 : 48; // px
  const textSize = variant === "header" ? "text-lg md:text-xl" : "text-xl";
  const iconContainerClass =
    variant === "header"
      ? "bg-white/10 border border-white/10 p-1.5 rounded-lg shadow-sm group-hover:bg-white/20 transition-all"
      : "bg-white/5 border border-white/10 p-2 rounded-xl mb-3 inline-flex";

  const titleClass = "font-bold tracking-tight text-white";
  const accentClass = "text-yellow-400 font-serif italic ml-[1px]";

  return (
    <div
      className={`flex items-center gap-3 group ${variant === "footer" ? "flex-col items-start gap-0" : ""}`}
    >
      {/* Icon Container */}
      <div
        className={`relative flex items-center justify-center ${iconContainerClass}`}
      >
        <NextImage
          src="/gold-android-chrome-512x512.png"
          alt="MyDurhamLaw Shield"
          width={iconSize}
          height={iconSize}
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>

      {/* Wordmark */}
      <div className={`flex flex-col leading-tight ${textSize}`}>
        <span className={titleClass}>
          MyDurham<span className={accentClass}>Law</span>
        </span>
      </div>
    </div>
  );
};
