import React from "react";

const TIPS = [
  { title: "Stay Safe After Dark", desc: "Stick to well-lit streets. Walk in groups where possible." },
  { title: "Weather", desc: "Check for rain and wind daily. Dress in layers; carry an umbrella or raincoat." },
  { title: "River Safety", desc: "Avoid getting too close to slippery banks, especially after rain." },
  { title: "Emergency Apps", desc: "Download the SafeZone uni app & save emergency numbers on your phone." },
];

export default function SafetyTipsSection() {
  return (
    <section id="safety" aria-labelledby="safety-heading" className="mb-8">
      <h2 id="safety-heading" className="text-2xl font-bold mb-4 text-indigo-700">Safety & Tips</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {TIPS.map(tip => (
          <div key={tip.title} className="bg-indigo-50 p-4 rounded shadow min-h-[90px]">
            <h3 className="font-semibold">{tip.title}</h3>
            <p className="text-sm text-indigo-900">{tip.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
