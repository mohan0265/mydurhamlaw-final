import React from "react";

const CATEGORIES = [
  { label: "Essentials", href: "#essentials" },
  { label: "Healthcare", href: "#healthcare" },
  { label: "Transport", href: "#transport" },
  { label: "Shopping & Dining", href: "#dining" },
  { label: "Post & Gov", href: "#post-gov" },
  { label: "Events", href: "#events" },
  { label: "Safety", href: "#safety" },
  { label: "Map", href: "#map" },
  { label: "Student Social", href: "#social" },
];

export default function CategoryTabs() {
  return (
    <nav aria-label="Main Community Sections">
      <ul className="flex flex-wrap gap-2 justify-center mb-6">
        {CATEGORIES.map(cat => (
          <li key={cat.label}>
            <a
              href={cat.href}
              className="px-3 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium focus:outline focus:ring"
            >
              {cat.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
