// src/components/community/MapSection.tsx
const durhamCoords = "54.7750,-1.5833"

export default function MapSection() {
  return (
    <section className="bg-white rounded-xl shadow overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b">📍 Navigate Durham</h2>
      <div className="relative w-full" style={{ height: '400px' }}>
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent('Durham, UK')}&center=${durhamCoords}&zoom=14`}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
      <div className="p-4 bg-gray-50">
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=Durham+University`, '_blank')}
          className="text-blue-600 hover:underline text-sm"
        >
          Get Directions to Campus →
        </button>
      </div>
    </section>
  )
}