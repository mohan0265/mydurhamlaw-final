import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/AuthContext";

function Card({
  title,
  desc,
  href,
  badge,
}: { title: string; desc: string; href: string; badge?: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-white/80 backdrop-blur hover:bg-white transition shadow-sm hover:shadow-md p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {badge ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
      <div className="mt-4 text-indigo-700 text-sm font-medium">
        Open →
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth() || { user: null };
  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Hero */}
      <section className="mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 sm:p-8 shadow">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Welcome back, {name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-2">
            Your hub for study, planning, and the Durham community.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/lounge"
              className="rounded-lg bg-white text-indigo-700 text-sm font-semibold px-3 py-2 hover:bg-white/90"
            >
              Go to Student Lounge
            </Link>
            <Link
              href="/community"
              className="rounded-lg bg-white/10 text-white text-sm font-semibold px-3 py-2 hover:bg-white/20 border border-white/20"
            >
              Explore Durham Community
            </Link>
          </div>
        </div>
      </section>

      {/* Cards grid */}
      <section className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="My Year at a Glance"
          desc="Browse your academic year by term, month, or week."
          href="/yaag"
          badge="Planner"
        />
        <Card
          title="Study Resources"
          desc="Curated materials and guides to help you excel."
          href="/resources"
        />
        <Card
          title="Legal News"
          desc="Keep up with the latest developments and cases."
          href="/news"
        />
        <Card
          title="Premier Student Lounge"
          desc="Unwind, connect with peers, and join live activities."
          href="/lounge"
          badge="Social"
        />
        <Card
          title="Durham Community"
          desc="Emergency contacts, health, transport, dining, events, and map."
          href="/community"
          badge="City Guide"
        />
        <Card
          title="About MyDurhamLaw"
          desc="What this platform offers and how to make the most of it."
          href="/about"
        />
      </section>
    </main>
  );
}
