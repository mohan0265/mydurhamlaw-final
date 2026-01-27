import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ArticlesIndex() {
  const articles = [
    {
      title: "No Question Is a Stupid Question",
      tag: "Learning Psychology",
      description:
        "Why fear stops students from learning — and how judgement-free questioning builds confidence.",
      href: "/articles/no-question-is-a-stupid-question",
      featured: true,
      readTime: "8 min read",
    },
  ];

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Head>
        <title>Articles | MyDurhamLaw</title>
        <meta
          name="description"
          content="Guides for Durham Law students: learning psychology, confidence, study systems, exam prep, and legal writing."
        />
        <link rel="canonical" href="https://mydurhamlaw.com/articles" />
      </Head>

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-16 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Articles
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Evidence-based guides on learning, confidence, and Durham Law
              study habits.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                prefetch={false}
                className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden"
              >
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    {article.featured && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                        Featured
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Tag className="w-3 h-3" />
                      {article.tag}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h2>

                  <p className="text-gray-600 mb-8 flex-1 leading-relaxed">
                    {article.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <Clock className="w-4 h-4" />
                      {article.readTime}
                    </span>
                    <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-20 p-12 bg-gray-50 rounded-3xl text-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Looking for more?
            </h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Our Learning Hub contains technical guides on IRAC, OSCOLA, and
              Durham-specific procedures.
            </p>
            <Link href="/learn" prefetch={false}>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-white hover:border-indigo-600 hover:text-indigo-600"
              >
                Browse Learning Hub
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
