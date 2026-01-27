import React, { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowRight,
  Clock,
  Zap,
  BookOpen,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { guides, Guide } from "@/content/articlesIndex";

export default function GuidesHub() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "All",
    "Psychology",
    "Study Skills",
    "Writing",
    "Speaking",
    "Ethics",
    "Exam Prep",
    "News",
  ];

  const filteredGuides = useMemo(() => {
    return guides
      .filter((guide) => {
        const matchesCategory =
          activeCategory === "All" || guide.category.includes(activeCategory);
        const matchesSearch =
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.order - b.order);
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Head>
        <title>Durham Law Guides & Articles | MyDurhamLaw</title>
        <meta
          name="description"
          content="Evidence-based guides for Durham Law students: confidence, legal writing, exam prep, and study systems."
        />
        <link rel="canonical" href="https://mydurhamlaw.com/guides" />
      </Head>

      <main className="flex-1 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-16 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-indigo-100">
              Educational Resources
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Durham Law <span className="text-indigo-600">Guides</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              Step-by-step strategies helping you master legal study, maintain
              integrity, and thrive throughout your degree.
            </p>
          </header>

          {/* SEARCH & FILTER */}
          <div className="mb-12 space-y-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search guides (e.g. IRAC, integrity, confidence)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-700 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                    activeCategory === cat
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GUIDES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={guide.href}
                prefetch={false}
                className="group flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 overflow-hidden hover:-translate-y-1"
              >
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-6">
                    {guide.featured && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" /> Featured
                      </span>
                    )}
                    {guide.type === "demo" && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-emerald-100">
                        Interactive Demo
                      </span>
                    )}
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-auto">
                      {guide.category[0]}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                    {guide.title}
                  </h2>

                  <p className="text-gray-600 mb-8 flex-1 leading-relaxed text-sm font-medium opacity-80">
                    {guide.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.readTime}
                    </span>
                    <span className="text-indigo-600 font-black text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      {guide.type === "demo" ? "Try Demo" : "Read Guide"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div className="py-32 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">
                No results found for your search.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="mt-4 text-indigo-600 font-black hover:underline uppercase text-sm tracking-widest"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* TRUST FOOTER */}
          <div className="mt-24 p-8 md:p-16 bg-gray-950 rounded-[3rem] text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">
                Ready to excel?
              </h3>
              <p className="text-xl text-indigo-100/60 mb-10 max-w-2xl mx-auto font-medium">
                Our tools are designed specifically for the Durham Law
                curriculum. Start your journey to a first-class degree today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/eligibility?next=/signup&plan=free"
                  prefetch={false}
                >
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-10 py-5 text-xl font-bold rounded-2xl shadow-xl shadow-indigo-900/40">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/pricing" prefetch={false}>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-10 py-5 text-xl font-bold rounded-2xl"
                  >
                    Compare Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
