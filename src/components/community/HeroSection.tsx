// src/components/community/HeroSection.tsx
import Image from 'next/image'

const images = [
  '/images/cathedral-night.jpg',
  '/images/river-wear-punting.jpg',
  '/images/durham-market.jpg',
]

export default function HeroSection() {
  return (
    <div className="relative h-96 sm:h-screen overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6 z-10">
        <div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-lg">
            Welcome to Durham
          </h1>
          <p className="mt-4 text-lg sm:text-xl drop-shadow">
            Your life beyond law school starts here.
          </p>
          <button
            onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full font-medium transition"
          >
            Explore Now
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        {images.map((src, i) => (
          <Image
            key={i}
            src={src}
            alt="Durham scenic"
            fill
            className="object-cover transition-opacity duration-1000"
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}></div>
        ))}
      </div>
    </div>
  )
}