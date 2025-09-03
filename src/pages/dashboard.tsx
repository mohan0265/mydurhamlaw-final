// src/pages/dashboard.tsx
import React from "react";
import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  desc: string;
  badge?: string;
};

function DashCard({ href, title, desc, badge }: CardProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border bg-white/90 shadow-sm hover:shadow-md transition p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {badge ? (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          My Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Quick links to everything in MyDurhamLaw.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashCard
            href="/community"
            title="Durham Community"
            desc="City essentials for students: emergency contacts, healthcare, transport, dining, maps & more."
            badge="New"
          />
          <DashCard
            href="/lounge"
            title="Premier Student Lounge"
            desc="Share wins, ask questions, and connect with peers."
          />
          <DashCard
            href="/community-network"
            title="Community Network"
            desc="Discover classmates by year and DM when enabled."
          />
          <DashCard
            href="/wellbeing"
            title="AI Tools"
            desc="Wellbeing & AI assistants. Start a chat or use helpful tools."
          />
          <DashCard
            href="/yaag"
            title="My Year at a Glance"
            desc="Key dates, terms and deadlines at a glance."
          />
          <DashCard
            href="/resources"
            title="Study Resources"
            desc="Guides, references, and research shortcuts."
          />
        </div>
      </section>
    </main>
  );
}
