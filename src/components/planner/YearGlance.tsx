"use client";
import React, { useMemo, useState } from "react";
import { DURHAM_LLB_2025_26, getPrevYearKey, getNextYearKey } from "@/data/durham/llb";
type YearKey = "foundation" | "year1" | "year2" | "year3";

export default function YearGlance() {
  const [current, setCurrent] = useState<YearKey>("year1");
  const plan = DURHAM_LLB_2025_26[current];

  const summary = useMemo(() => {
    const total = plan.modules.reduce((a,m)=>a+m.credits,0);
    const compulsory = plan.modules.filter(m=>m.compulsory).length;
    return { total, compulsory, electives: plan.modules.length - compulsory };
  }, [plan]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button className="px-3 py-2 rounded-lg border"
          onClick={()=>setCurrent(getPrevYearKey(current))}>← Prev</button>
        <h1 className="text-2xl font-semibold">
          My Year at a Glance · {plan.yearLabel} ({plan.academicYear})
        </h1>
        <button className="px-3 py-2 rounded-lg border"
          onClick={()=>setCurrent(getNextYearKey(current))}>Next →</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {( ["michaelmas","epiphany","easter"] as const).map(termKey=>{
          const t = plan.termDates[termKey];
          return (
            <div key={termKey} className="rounded-xl border p-4">
              <div className="text-sm font-medium uppercase mb-2">{termKey}</div>
              <div className="text-xs text-gray-600 mb-2">{t.start} → {t.end}</div>
              <div className="text-xs">Weeks: {t.weeks.length}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Module</th>
              <th className="text-left p-3">Credits</th>
              <th className="text-left p-3">Delivery</th>
              <th className="text-left p-3">Assessments</th>
            </tr>
          </thead>
          <tbody>
            {plan.modules.map((m, i)=>(
              <tr key={i} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-gray-600">{m.code || "—"} {m.compulsory ? "• compulsory" : ""}</div>
                </td>
                <td className="p-3">{m.credits}</td>
                <td className="p-3">{m.delivery}</td>
                <td className="p-3">
                  <ul className="list-disc pl-5 space-y-1">
                    {m.assessments.map((a, j)=>{
                      if ("window" in a) return <li key={j}>{a.type} · {a.weight ?? ""}% · {a.window.start} → {a.window.end}</li>;
                      if ("wordCount" in a) return <li key={j}>{a.type} · {a.wordCount} words · due {a.due}</li>;
                      return <li key={j}>{a.type} · {a.weight ?? ""}% · due {a.due}</li>;
                    })}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="p-3 font-medium">Totals</td>
              <td className="p-3">{summary.total}</td>
              <td className="p-3" colSpan={2}>
                {summary.compulsory} compulsory · {summary.electives} electives
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
