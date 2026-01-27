import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BookOpen, Clock } from "lucide-react";
import { articles, Article } from "@/content/articlesIndex";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

interface RelatedGuidesProps {
  currentHref: string;
}

export const RelatedGuides: React.FC<RelatedGuidesProps> = ({
  currentHref,
}) => {
  const currentIndex = articles.findIndex((a) => a.href === currentHref);
  const currentArticle = articles[currentIndex];

  const readNext = useMemo(() => {
    if (currentIndex === -1) return articles[0];
    const nextIndex = (currentIndex + 1) % articles.length;
    return articles[nextIndex];
  }, [currentIndex]);

  const related = useMemo(() => {
    if (!currentArticle)
      return articles.filter((a) => a.href !== currentHref).slice(0, 3);

    // Sort by shared tags
    const scored = articles
      .filter((a) => a.href !== currentHref && a.href !== readNext.href)
      .map((a) => {
        const sharedTags = a.tags.filter((t) =>
          currentArticle.tags.includes(t),
        ).length;
        return { ...a, score: sharedTags };
      })
      .sort((a, b) => b.score - a.score || a.order - b.order);

    return scored.slice(0, 3);
  }, [currentHref, currentArticle, readNext]);

  return (
    <div className="mt-20 pt-16 border-t border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Read Next Section */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">
            Read Next
          </h3>
          <Link href={readNext.href} prefetch={false} className="group">
            <Card
              hover
              className="h-full border-indigo-100 shadow-indigo-50/50"
            >
              <CardContent className="p-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                  {readNext.category}
                </span>
                <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                  {readNext.title}
                </h4>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {readNext.description}
                </p>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  Continue Reading{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Related Guides Section */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
            Related Guides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                prefetch={false}
                className="group"
              >
                <div className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                  <h5 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h5>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-gray-50 rounded-3xl border border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-widest">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Learning Resources</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/articles"
            prefetch={false}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guides
          </Link>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-indigo-600 bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Home Hub
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RelatedGuides;
