import React from "react";

const POST_OFFICES = [
  {
    branch: "Durham City Post Office",
    map: "https://goo.gl/maps/RnaEUMCRaFw2",
    hours: "Mon-Fri 8:30am–5:30pm, Sat 9am–1pm",
  },
  {
    branch: "Gilesgate Post Office",
    map: "https://goo.gl/maps/5ZsrYzEznNs5gQv88",
    hours: "Mon-Fri 9am–5:30pm, Sat 9am–12:30pm",
  },
];
const COUNCIL = "https://durham.gov.uk";
const VISA_SUPPORT = "https://www.gov.uk/browse/visas-immigration";

export function PostAndGovSection() {
  return (
    <section id="post-gov" aria-labelledby="postgov-heading" className="mb-8">
      <h2 id="postgov-heading" className="text-2xl font-bold mb-4 text-indigo-700">Post & Government Services</h2>
      <ul className="space-y-3">
        {POST_OFFICES.map(po => (
          <li key={po.branch}>
            <b>{po.branch}</b> —{" "}
            <span className="text-gray-500">{po.hours}</span>{" "}
            <a href={po.map} target="_blank" rel="noopener noreferrer" className="btn-secondary">Map</a>
          </li>
        ))}
        <li>
          <b>Council Services:</b>{" "}
          <a href={COUNCIL} target="_blank" rel="noopener noreferrer" className="btn-primary">Durham County Council</a>
        </li>
        <li>
          <b>Visa/Immigration Support:</b>{" "}
          <a href={VISA_SUPPORT} target="_blank" rel="noopener noreferrer" className="btn-secondary">UK Gov Portal</a>
        </li>
      </ul>
    </section>
  );
}
