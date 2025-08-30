// src/pages/year-at-a-glance/index.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/lib/supabase/AuthContext";
import { getDefaultPlanByStudentYear } from "@/data/durham/llb";

const YearView = dynamic(() => import("@/components/calendar/YearView"), { ssr: false });

export default function YearAtAGlance() {
  const { session, userProfile } = useContext(AuthContext);

  // Pick the student’s year (fallback Y1 if profile missing)
  const normalizedYearGroup =
    (userProfile?.year_group || "year1").toLowerCase().replace(/\s/g, "") as
      | "foundation"
      | "year1"
      | "year2"
      | "year3";

  const yearOfStudy = useMemo(() => {
    const plan = getDefaultPlanByStudentYear(normalizedYearGroup);
    return plan.yearKey === "foundation" ? 0 : Number(plan.yearKey.replace("year", ""));
  }, [normalizedYearGroup]);

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Sign in required</h2>
          <p className="text-gray-600 mt-2">Please sign in to view your year plan.</p>
          <a className="inline-block mt-4 rounded-md px-4 py-2 border hover:bg-gray-50" href="/login">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Year at a Glance</title>
        <meta name="description" content="One-page eagle-eye view of your academic year." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 3-column syllabus grid */}
        <YearView userYearOfStudy={yearOfStudy} />
      </div>
    </>
  );
}
