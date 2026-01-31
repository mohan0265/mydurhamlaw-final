import React from "react";
import { Plus, CheckCircle } from "lucide-react";

export default function DemoTodaysTasks() {
  const tasks = [
    { id: "t1", title: "Review Contract Law notes", status: "completed" },
    { id: "t2", title: "Read Chapter 4 of Constitutional Law", status: "open" },
    { id: "t3", title: "Prepare for Tutorial: Negligence", status: "open" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Today&apos;s Tasks</h2>
        <button className="p-1 rounded-md hover:bg-gray-100 text-purple-600">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto max-h-[300px]">
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 group cursor-default"
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${task.status === "completed" ? "bg-green-100 border-green-500 text-green-600" : "border-gray-300 text-transparent"}`}
              >
                <CheckCircle
                  className={`w-3.5 h-3.5 ${task.status === "completed" ? "opacity-100" : "opacity-0"}`}
                />
              </div>
              <span
                className={`text-sm transition-all ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-3 border-t bg-gray-50 rounded-b-xl text-center">
        <span className="text-xs font-medium text-purple-600 hover:underline">
          View all tasks
        </span>
      </div>
    </div>
  );
}
