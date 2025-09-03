// src/pages/dashboard.tsx
import Link from "next/link";

export default function Dashboard() {
  const cards = [
    {
      title: "My Year at a Glance",
      desc: "See your semesters, weeks and topics at a glance.",
      href: "/year-at-a-glance",
    },
    {
      title: "Premier Student Lounge",
      desc: "Relax, connect, and join the community.",
      href: "/lounge",
    },
    {
      title: "Durham Community",
      desc: "Emergency info, transport, events, dining and local map.",
      href: "/community",
    },
    {
      title: "Study Resources",
      desc: "Curated materials and tools for your modules.",
      href: "/resources",
    },
    {
      title: "Legal News",
      desc: "Stay updated with key legal news and cases.",
      href: "/news",
    },
    {
      title: "About",
      desc: "What this platform offers and how to get the most from it.",
      href: "/about",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2">Welcome to your Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Quick links to everything in MyDurhamLaw. Pick a card to jump in.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-lg font-medium mb-1">{c.title}</div>
            <div className="text-sm text-gray-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
