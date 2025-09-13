import React from "react";

const ESSENTIALS = [
  { name: "Police (Emergency)", call: "999", map: "https://goo.gl/maps/51caiMb5mGkLeAaK8" },
  { name: "Police (Non-Emergency)", call: "101" },
  { name: "Ambulance (Emergency)", call: "999" },
  { name: "NHS 111 (Medical Helpline)", call: "111" },
  { name: "Univ. Hospital of North Durham A&E", call: "0191 333 2333", map: "https://goo.gl/maps/7yUL8kvcn6Vyiaeh7" },
  { name: "Durham Uni Campus Security", call: "0191 334 2222", map: "https://durham.ac.uk/student-support/contact" },
  { name: "Student Support & Wellbeing", call: "0191 334 6447", map: "https://durham.ac.uk/student-support/" },
  { name: "Boots Pharmacy", call: "0191 386 4011", map: "https://goo.gl/maps/xqQnKp1jgs92" },
];

export function EmergencyEssentialsSection() {
  return (
    <section id="essentials" aria-labelledby="essentials-heading" className="mb-8">
      <h2 id="essentials-heading" className="text-2xl font-bold mb-4 text-indigo-700">Emergency & Essentials</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ESSENTIALS.map(e => (
          <div key={e.name} className="bg-white rounded-lg shadow p-3 flex flex-col justify-between min-h-[130px]">
            <h3 className="font-semibold text-indigo-900">{e.name}</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              {e.call && (
                <a href={`tel:${e.call.replace(/\s+/g, "")}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="btn-primary"
                   aria-label={`Call ${e.name}`}>
                  📞 Call {e.call}
                </a>
              )}
              {e.map && (
                <a
                  href={e.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  aria-label={`View ${e.name} on map`}>
                  🗺️ Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
