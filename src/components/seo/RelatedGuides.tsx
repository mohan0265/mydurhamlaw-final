import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen, Home } from "lucide-react";
import { guides, Guide } from "@/content/articlesIndex";

interface RelatedGuidesProps {
  currentSlug: string;
  categories?: string[];
  pinnedSlugs?: string[];
}

export default function RelatedGuides({
  currentSlug,
  categories,
  pinnedSlugs = [],
}: RelatedGuidesProps) {
  // Find current index to determine "Read Next"
  const currentIndex = guides.findIndex((g) => g.slug === currentSlug);

  // Read Next: The very next one in the list (ordered by 'order' in the file), or wrap to the first one
  const nextGuide = useMemo(() => {
    if (guides.length === 0) return undefined;
    if (currentIndex === -1) return guides[0];
    const nextIdx = (currentIndex + 1) % guides.length;
    return guides[nextIdx];
  }, [currentIndex]);

  if (!nextGuide) return null;

  // Related: 3 items that share categories, excluding current and next
  // If pinnedSlugs is present, those come first.
  const related = useMemo(() => {
    const currentGuide = guides.find((g) => g.slug === currentSlug);
    const currentTags = currentGuide?.tags || [];

    // 1. Get pinned guides that exist (excluding current and next)
    const pinnedGuides = pinnedSlugs
      .map((slug) => guides.find((g) => g.slug === slug))
      .filter(
        (g): g is Guide =>
          !!g && g.slug !== currentSlug && g.slug !== nextGuide?.slug,
      );

    // 2. Get list of other possible guides
    const otherCandidates = guides.filter(
      (g) =>
        g.slug !== currentSlug &&
        g.slug !== nextGuide?.slug &&
        !pinnedSlugs.includes(g.slug),
    );

    let relatedList = [...pinnedGuides];

    if (relatedList.length < 3) {
      const remainingCount = 3 - relatedList.length;

      let fillList = [...otherCandidates];

      // Sort remaining by number of shared categories and tags
      fillList = fillList.sort((a, b) => {
        const sharedCatA = categories
          ? a.category.filter((c) => categories.includes(c)).length
          : 0;
        const sharedCatB = categories
          ? b.category.filter((c) => categories.includes(c)).length
          : 0;

        const sharedTagA = a.tags
          ? a.tags.filter((t) => currentTags.includes(t)).length
          : 0;
        const sharedTagB = b.tags
          ? b.tags.filter((t) => currentTags.includes(t)).length
          : 0;

        const scoreA = sharedCatA * 2 + sharedTagA;
        const scoreB = sharedCatB * 2 + sharedTagB;

        return scoreB - scoreA;
      });

      relatedList = [...relatedList, ...fillList.slice(0, remainingCount)];
    }

    return relatedList.slice(0, 3);
  }, [currentSlug, nextGuide?.slug, categories, pinnedSlugs]);

  return (
    <div className="mt-24 pt-16 border-t border-gray-100">
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Read Next (Large Card) */}
        <div className="lg:col-span-1">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 fill-indigo-600" />
            Read Next
          </h3>
          <Link
            href={nextGuide.href}
            prefetch={false}
            className="group flex flex-col h-full bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all duration-500"
          >
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4 block">
              {nextGuide.category[0]}
            </span>
            <h4 className="text-2xl font-bold mb-6 group-hover:underline underline-offset-4">
              {nextGuide.title}
            </h4>
            <p className="text-indigo-100/80 text-sm mb-8 leading-relaxed font-medium">
              {nextGuide.description}
            </p>
            <div className="mt-auto flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-60">
                <Clock className="w-3.5 h-3.5" />
                {nextGuide.readTime}
              </span>
              <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Related (List) */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
            Related Guides
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {related.map((guide) => (
              <Link
                key={guide.slug}
                href={guide.href}
                prefetch={false}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {guide.category[0]}
                  </span>
                  {guide.type === "demo" && (
                    <span className="text-[8px] font-black uppercase p-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
                      Demo
                    </span>
                  )}
                </div>
                <h5 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {guide.title}
                </h5>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                  {guide.description}
                </p>
                <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {guide.readTime}
                  </span>
                  <ArrowRight className="w-3 h-3 text-indigo-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}

            {/* Hub Links */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/guides" prefetch={false} className="flex-1">
                <button className="w-full py-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                  <BookOpen className="w-4 h-4" />
                  Back to Guides Hub
                </button>
              </Link>
              <Link href="/" prefetch={false} className="flex-1">
                <button className="w-full py-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                  <Home className="w-4 h-4" />
                  Return to Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Zap icon helper to avoid missing import
function Zap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
