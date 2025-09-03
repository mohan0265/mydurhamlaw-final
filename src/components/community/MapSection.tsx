import React, { useState } from "react";

const PLACES = [
  { label: "Campus", coords: "54.7658,-1.5757" },
  { label: "Hospital (A&E)", coords: "54.7847,-1.5907" },
  { label: "Police", coords: "54.7758,-1.5756" },
  { label: "Post Office", coords: "54.7762,-1.5730" },
  { label: "City Centre", coords: "54.7767,-1.5756" },
];

export function MapSection() {
  const [center, setCenter] = useState(PLACES[0].coords);
  const mapUrl = `https://maps.google.com/maps?q=${center}&z=15&output=embed`;

  return (
    <section id="map" aria-labelledby="map-heading" className="mb-8">
      <h2 id="map-heading" className="text-2xl font-bold mb-4 text-indigo-700">Neighbourhood Map</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {PLACES.map(p => (
          <button
            key={p.label}
            className={`btn-secondary ${center === p.coords ? "ring-2 ring-indigo-400" : ""}`}
            aria-pressed={center === p.coords}
            onClick={() => setCenter(p.coords)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="aspect-video w-full bg-gray-100 rounded shadow overflow-hidden focus-within:ring">
        <iframe
          src={mapUrl}
          title="Durham Map"
          loading="lazy"
          className="w-full h-80 border-0"
          aria-label="Google Map of Durham"
        />
      </div>
    </section>
  );
}
