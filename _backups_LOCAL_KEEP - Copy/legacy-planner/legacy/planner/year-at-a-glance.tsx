import dynamic from "next/dynamic";

const YearAtAGlanceView = dynamic(() => import("@/components/planner/YearAtAGlanceView"), { ssr: false });

export default function YearAtAGlance() {
  return <YearAtAGlanceView />;
}

/* NOTE:
   REMOVE any of these if present:
   export const config = { runtime: "edge" };
   export const runtime = "edge";
*/
