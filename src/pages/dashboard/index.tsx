// src/pages/dashboard/index.tsx
import React from "react";
import Link from "next/link";

function Card({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="text-base font-semibold text-gray-900">{title}</div>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <div className="mt-3 text-sm font-medium text-indigo-600">Open →</div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h1 className="text-white text-2xl sm:text-3xl font-bold">
            My Dashboard
          </h1>
          <p className="text-white/90 mt-2 max-w-3xl">
            Quick access to everything: study, assignments, exam prep, the
            Student Lounge, and the Durham Community hub.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card
            href="/year-at-a-glance"
            title="Year at a Glance"
            desc="Browse your full academic year by term, month, and week."
          />
          <Card
            href="/study-materials"
            title="Study Materials"
            desc="Your course notes, readings, and materials in one place."
          />
          <Card
            href="/assignments"
            title="Assignments"
            desc="Track deadlines and progress across all modules."
          />
          <Card
            href="/assignment-generator"
            title="Assignment Helper"
            desc="Generate structured outlines and kickstart your writing."
          />
          <Card
            href="/study-schedule"
            title="Study Schedule"
            desc="Plan sessions and stay on track week by week."
          />
          <Card
            href="/lounge"
            title="Student Lounge"
            desc="Unwind, chat, RSVP virtual coffee, and meet peers."
          />
          <Card
            href="/community"
            title="Durham Community"
            desc="Emergency contacts, healthcare, transport, events & local guide."
          />
          <Card
            href="/calendar"
            title="Calendar"
            desc="See everything at a glance and avoid conflicts."
          />
          <Card
            href="/news"
            title="Legal News"
            desc="Curated legal headlines and updates for law students."
          />
          <Card
            href="/research-hub"
            title="Research Hub"
            desc="Tools and resources to boost your legal research."
          />
          <Card
            href="/wellbeing"
            title="Wellbeing"
            desc="Support resources for a healthy, balanced journey."
          />
        </div>
      </div>
    </main>
  );
}
