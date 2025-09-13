import React from "react";

const GP_FINDER = "https://www.nhs.uk/service-search/find-a-gp";
const MENTAL_HEALTH_LINK = "https://www.nhs.uk/mental-health/";

export function HealthcareSection() {
  return (
    <section id="healthcare" aria-labelledby="healthcare-heading" className="mb-8">
      <h2 id="healthcare-heading" className="text-2xl font-bold mb-4 text-indigo-700">Healthcare & Wellbeing</h2>
      <ul className="space-y-2">
        <li>
          <strong>
            GP Registration:
          </strong>{' '}
          <a href={GP_FINDER} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline focus:outline focus:ring">
            Register for a local GP (NHS Finder)
          </a>
        </li>
        <li>
          <strong>Walk-in Clinics:</strong> <span>Check with NHS site or local pharmacies for minor ailments.</span>
        </li>
        <li>
          <strong>Mental Health Resources:</strong>{' '}
          <a href={MENTAL_HEALTH_LINK} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline focus:outline focus:ring">
            NHS Mental Health
          </a>
        </li>
      </ul>
    </section>
  );
}
