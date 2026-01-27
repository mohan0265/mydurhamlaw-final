import React, { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Clock, Tag, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { articles, Article } from "@/content/articlesIndex";

export default function ArticlesIndex() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return ["All", ...Array.from(cats)].sort();
  }, []);

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Head>
        <title>Durham Law Guides & Articles | MyDurhamLaw</title>
        <meta
          name="description"
          content="Evidence-based guides for Durham Law students: confidence, questioning, legal writing, exam prep, and study systems."
        />
        <link rel="canonical" href="https://mydurhamlaw.com/articles" />
      </Head>

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-16 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100">
              <Search className="w-3.5 h-3.5" />
              Resource Hub
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Guides & Articles
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Evidence-based strategies on learning, confidence, and Durham Law
              habits.
            </p>
          </header>

          {/* Filter UI */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                    : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                prefetch={false}
                className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden"
              >
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    {article.featured && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm shadow-indigo-200">
                        Featured
                      </span>
                    )}
                    <span className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-gray-100">
                      {article.category}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h2>

                  <p className="text-gray-600 mb-8 flex-1 leading-relaxed text-sm">
                    {article.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-indigo-300" />
                      {article.readTime}
                    </span>
                    <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-500 italic">
                No articles found in this category.
              </p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-4 text-indigo-600 font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-20 p-8 md:p-12 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2.5rem] text-center text-white shadow-2xl shadow-indigo-200">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Master Your Law Degree
            </h3>
            <p className="text-indigo-100 mb-10 max-w-2xl mx-auto text-lg opacity-90">
              Join the growing community of Durham students using AI to study
              smarter, stay organized, and keep connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" prefetch={false}>
                <Button className="bg-white text-indigo-900 hover:bg-gray-100 px-8 py-4 text-lg w-full sm:w-auto font-bold rounded-2xl shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login" prefetch={false}>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg w-full sm:w-auto font-bold rounded-2xl backdrop-blur-sm"
                >
                  Member Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
