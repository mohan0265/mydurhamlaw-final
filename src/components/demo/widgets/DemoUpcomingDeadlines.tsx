import React from "react";
import { useRouter } from "next/router";
import { CheckCircle, Clock } from "lucide-react";

export default function DemoUpcomingDeadlines() {
  const router = useRouter();

  const assignments = [
    {
      id: "demo-1",
      title: "Problem Question: Contract Law Remedies",
      module: "Contract Law",
      dueDate: new Date(Date.now() + 86400000 * 4), // 4 days from now
      daysLeft: 4,
      status: "drafting",
      nextAction: "continue",
    },
    {
      id: "demo-2",
      title: "Essay: Separation of Powers",
      module: "Public Law (UK)",
      dueDate: new Date(Date.now() + 86400000 * 12), // 12 days
      daysLeft: 12,
      status: "planning",
      nextAction: "start",
    },
    {
      id: "demo-3",
      title: "Tort Law: Negligence Case Analysis",
      module: "Tort Law",
      dueDate: new Date(Date.now() + 86400000 * 20),
      daysLeft: 20,
      status: "not_started",
      nextAction: "start",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Upcoming Deadlines
        </h2>
        <button className="text-sm text-blue-600 hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="p-4 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-default"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {assignment.title}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {assignment.module}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">
                    Due{" "}
                    {assignment.dueDate.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${assignment.daysLeft <= 5 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                  >
                    {assignment.daysLeft}d left
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    {assignment.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${assignment.nextAction === "start" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-600 text-white hover:bg-slate-700"}`}
              >
                {assignment.nextAction === "start" ? "▶ Start" : "▶ Continue"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
