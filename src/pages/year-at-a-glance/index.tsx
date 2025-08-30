// src/pages/year-at-a-glance/index.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

import {
  YEAR_LABEL,
  type YearKey,
  hrefMonth,
  hrefWeek,
  hrefYear,
  parseYearKey,
  readYearKey,
  persistYearKey,
  getPrevYearKey,
  getNextYearKey,
} from "@/lib/calendar/links";
import { DURHAM_LLB_2025_26 } from "@/data/durham/llb";

// NOTE: YearView uses browser-only bits; dynamic import with SSR disabled.
// Also guard module shape so TS is happy whether default or named export.
const YearView = dynamic<any>(
  () =>
    import("@/components/calendar/YearView").then((m: any) =>
      "default" in m ? m.default : m.YearView
    ),
  { ssr: false }
);

export default function YearAtAGlancePage() {
  const router = useRouter();

  // 1) decide which year to show
  const queryYear = parseYearKey(router.query.y);
  const [y, setY] = useState<YearKey>(() => queryYear || readYearKey());

  useEffect(() => {
    const want = parseYearKey(router.query.y);
    const finalY = want || readYearKey();
    setY(finalY);
    persistYearKey(finalY);
  }, [router.query.y]);

  // 2) compute prev/next for header arrows
  const prevY = useMemo(() => getPrevYearKey(y), [y]);
  const nextY = useMemo(() => getNextYearKey(y), [y]);

  const title = `My Year at a Glance • ${YEAR_LABEL[y]}`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">My Year at a Glance</h1>
            <span className="text-sm text-gray-500">{YEAR_LABEL[y]}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Back to Month / Week quick links (open for current year) */}
            <Link
              href={hrefMonth(y)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Month View
            </Link>
            <Link
              href={hrefWeek(y)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Week View
            </Link>

            {/* Year switchers */}
            <Link
              aria-label="Previous year"
              href={hrefYear(prevY)}
              className="inline-flex items-center rounded-lg border px-2 py-1.5 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              aria-label="Next year"
              href={hrefYear(nextY)}
              className="inline-flex items-center rounded-lg border px-2 py-1.5 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className="mt-6">
          <YearView
            // YearView reads from our static Durham plan for now
            yearOverview={DURHAM_LLB_2025_26[y]}
            multiYearData={DURHAM_LLB_2025_26}
            moduleProgress={null}
            userYearOfStudy={y === "foundation" ? 0 : Number(y.replace("year", ""))}
            onModuleClick={() => {}}
            onEventClick={() => {}}
          />
        </div>

        {/* Empty-state guard (if plan missing) */}
        {!DURHAM_LLB_2025_26[y] && (
          <div className="mt-10 text-center text-gray-600">
            <Calendar className="w-10 h-10 mx-auto mb-2" />
            Plan unavailable for {YEAR_LABEL[y]}.
          </div>
        )}
      </div>
    </>
  );
}
