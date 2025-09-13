import React from "react";

const DINING_LIST = [
  { name: "Flat White Café", tags: ["£", "Coffee", "Brunch"], map: "https://goo.gl/maps/nsFQvJjRxnN2", hours: "8am–5pm" },
  { name: "Zen Durham", tags: ["££", "Asian", "Dinner"], map: "https://goo.gl/maps/xgXPXQrhWfo", hours: "12pm–10pm" },
];

export function DiningSection() {
  return (
    <section id="dining" aria-labelledby="dining-heading" className="mb-8">
      <h2 id="dining-heading" className="text-2xl font-bold mb-4 text-indigo-700">Shopping & Dining</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {DINING_LIST.map(place => (
          <div key={place.name} className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">{place.name}</h3>
            <div className="flex gap-2 my-1">
              {place.tags.map(tag => (
                <span key={tag} className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            <div className="text-sm text-gray-700">Open: {place.hours}</div>
            <a
              href={place.map}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-2 inline-block"
            >Map</a>
          </div>
        ))}
      </div>
    </section>
  );
}
