import React, { useState } from "react";

const EVENTS_LIST = [
  { title: "International Student Welcome", date: "2025-09-10", location: "Durham Student Union", link: "https://durham.ac.uk/events/welcome" },
  { title: "Durham Regatta", date: "2025-06-14", location: "River Wear", link: "https://durhamregatta.org.uk" },
];

export function EventsCarousel() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx(i => (i + 1) % EVENTS_LIST.length);
  const prev = () => setIdx(i => (i === 0 ? EVENTS_LIST.length - 1 : i - 1));
  const event = EVENTS_LIST[idx];

  if (!event) {
    return (
      <section id="events" aria-labelledby="events-heading" className="mb-8">
        <h2 id="events-heading" className="text-2xl font-bold mb-4 text-indigo-700">Events & Festivals</h2>
        <div className="bg-white rounded p-6 shadow text-indigo-800 min-h-[120px] flex flex-col items-center">
          <p>No events available</p>
        </div>
      </section>
    );
  }

  return (
    <section id="events" aria-labelledby="events-heading" className="mb-8">
      <h2 id="events-heading" className="text-2xl font-bold mb-4 text-indigo-700">Events & Festivals</h2>
      <div className="bg-white rounded p-6 shadow text-indigo-800 min-h-[120px] flex flex-col items-center">
        <div>
          <b>{event.title}</b>{" "}
          <span className="text-gray-700">{event.date}</span> <br />
          <span>{event.location}</span>
        </div>
        <a
          href={event.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-2"
        >Event info</a>
        <div className="mt-2 flex gap-2">
          <button className="btn-secondary" aria-label="Previous event" onClick={prev}>←</button>
          <button className="btn-secondary" aria-label="Next event" onClick={next}>→</button>
        </div>
      </div>
    </section>
  );
}
