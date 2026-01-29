import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Assignment } from "@/types/assignments"; // We'll define this type

interface AssignmentListProps {
  assignments: Assignment[];
  selectedId: string | null;
  onSelect: (assignment: Assignment) => void;
  onNew: () => void;
}

export default function AssignmentList({
  assignments,
  selectedId,
  onSelect,
  onNew,
}: AssignmentListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">(
    "active",
  );
  const [search, setSearch] = useState("");

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "completed"
              ? a.status === "completed" || a.status === "submitted"
              : a.status !== "completed" && a.status !== "submitted";

        const matchesSearch =
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.module_name?.toLowerCase().includes(search.toLowerCase()) ||
          a.module_code?.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      );
  }, [assignments, filter, search]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "submitted":
        return "bg-green-100 text-green-700 border-green-200";
      case "drafting":
      case "editing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "planning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Assignments</h2>
          <button
            onClick={onNew}
            className="p-2 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
            title="New Assignment"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {(["active", "all", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filter === t
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <div className="mb-2">📭</div>
            No assignments found
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => onSelect(assignment)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedId === assignment.id
                  ? "bg-violet-50 border-violet-200 ring-1 ring-violet-200"
                  : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(assignment.status)}`}
                >
                  {assignment.status === "not_started"
                    ? "Not started yet"
                    : assignment.status.replace("_", " ")}
                </span>
                <span
                  className={`text-xs flex items-center gap-1 ${(() => {
                    const due = new Date(assignment.due_date);
                    const now = new Date();
                    const diffHours =
                      (due.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const diffDays = diffHours / 24;

                    if (diffHours < 0) return "text-red-600 font-bold"; // Overdue
                    if (diffHours < 24) return "text-red-600 font-bold"; // < 24h
                    if (diffDays <= 3) return "text-amber-600 font-medium"; // 1-3 days
                    return "text-gray-500"; // > 3 days
                  })()}`}
                >
                  <Clock size={12} />
                  {(() => {
                    const due = new Date(assignment.due_date);
                    const now = new Date();
                    const diffHours =
                      (due.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (diffHours < 0) return "Overdue";
                    if (diffHours < 24) return "Due today";
                    return format(due, "MMM d");
                  })()}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                {assignment.title}
              </h3>

              {assignment.module_name && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  {assignment.module_code && (
                    <span className="font-mono text-[10px] mr-1 opacity-75">
                      {assignment.module_code}
                    </span>
                  )}
                  {assignment.module_name}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
