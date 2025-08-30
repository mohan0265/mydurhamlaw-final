// src/pages/year-at-a-glance/week.tsx
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Calendar, ChevronLeft } from "lucide-react";

import {
  YEAR_LABEL,
  type YearKey,
  hrefYear,
  parseYearKey,
} from "@/lib/calendar/links";

// Safe dynamic import (works for default or named export)
const WeekView = dynamic<any>(
  () =>
    import("@/components/calendar/WeekView").then((m: any) =>
      "default" in m ? m.default : m.WeekView
    ),
  { ssr: false }
);

export default function WeekPage() {
  const router = useRouter();
  const y = parseYearKey(router.query.y) as YearKey;
  const title = `Week View • ${YEAR_LABEL[y]}`;

  return (
    <>
      <Head><title>{title}</title></Head>

      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Week View</div>
          <Link href={hrefYear(y)} className="inline-flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Year
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <WeekView />
      </div>
    </>
  );
}
