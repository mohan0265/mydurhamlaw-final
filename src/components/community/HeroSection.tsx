import React, { useState, useEffect } from "react";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=960&q=80",
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=960&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=960&q=80",
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % HERO_IMAGES.length),
      5000,
    );
    return () => clearInterval(interval);
  }, []);
  return (
    <header
      className="relative h-72 md:h-96 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden mb-7"
      aria-label="Welcome Durnam Hero section"
    >
      <img
        src={HERO_IMAGES[index]}
        alt="Durham view"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        loading="lazy"
        draggable={false}
      />
      <div className="z-10 relative backdrop-blur-sm bg-white/70 p-8 rounded">
        <h1 className="text-3xl md:text-5xl font-bold text-indigo-700 drop-shadow">
          Welcome to Your Community
        </h1>
        <p className="mt-2 text-lg text-indigo-800 font-medium">
          Your trusted guide to exploring, studying, and thriving
        </p>
      </div>
    </header>
  );
}
