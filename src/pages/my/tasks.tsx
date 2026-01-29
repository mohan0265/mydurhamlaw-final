"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { withAuthProtection } from "@/lib/withAuthProtection";

type TaskStatus = "open" | "completed";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
};

type FilterMode = "all" | "open" | "completed";

function formatDateShort(value: string | null) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  } catch {
    return value;
  }
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  const openCount = useMemo(
    () => tasks.filter((t) => t.status === "open").length,
    [tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks],
  );

  const filtered = useMemo(() => {
    if (filter === "open") return tasks.filter((t) => t.status === "open");
    if (filter === "completed")
      return tasks.filter((t) => t.status === "completed");
    return tasks;
  }, [tasks, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = (await res.json()) as Task[];
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic: Task = {
      id: tempId,
      title: trimmed,
      status: "open",
      due_date: dueDate ? dueDate : null,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);

    setTitle("");
    setDueDate("");
    setAdding(false);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, due_date: dueDate || null }),
      });

      if (!res.ok) throw new Error("Create failed");
      const saved = (await res.json()) as Task;
      setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
      toast.success("Task added.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't add task.");
      // Re-sync
      fetchTasks();
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === "open" ? "completed" : "open";

    // Optimistic UI
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update task.");
      // Revert by re-fetch
      fetchTasks();
    }
  };

  const deleteTask = async (task: Task) => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Task deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete task.");
      setTasks(previous);
    }
  };

  return (
    <>
      <Head>
        <title>My Tasks - Caseway</title>
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdding((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  My Tasks
                </h1>
                <p className="mt-1 text-sm text-gray-600 leading-snug">
                  Keep momentum with small, clear actions — and tick them off.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  Open: {openCount}
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                  Completed: {completedCount}
                </span>
              </div>
            </div>

            {/* Add form */}
            {adding && (
              <form
                onSubmit={createTask}
                className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Task
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What needs doing?"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Due date (optional)
                    </label>
                    <div className="relative">
                      <CalendarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="submit"
                      disabled={saving || !title.trim()}
                      className="w-full inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Tip: Keep tasks small and specific (e.g. “Outline issue 2”
                  beats “Study tort”).
                </div>
              </form>
            )}

            {/* Filters */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filter</span>
              </div>

              <div className="flex items-center gap-2">
                {(["all", "open", "completed"] as FilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilter(mode)}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold border transition",
                      filter === mode
                        ? "bg-purple-50 text-purple-700 border-purple-100"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {mode === "all"
                      ? "All"
                      : mode === "open"
                        ? "Open"
                        : "Completed"}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    No tasks here yet.
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {filter === "completed"
                      ? "Finish a few tasks and they’ll show up here."
                      : "Add one small task and build momentum."}
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {filtered.map((task) => (
                    <li
                      key={task.id}
                      className="p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => toggleTask(task)}
                          className="flex items-start gap-3 text-left group"
                        >
                          <span className="mt-0.5">
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition" />
                            )}
                          </span>

                          <div>
                            <div
                              className={[
                                "text-sm font-semibold",
                                task.status === "completed"
                                  ? "text-gray-400 line-through"
                                  : "text-gray-900",
                              ].join(" ")}
                            >
                              {task.title}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Due: {formatDateShort(task.due_date)}
                              </span>
                              <span>
                                Created: {formatDateTime(task.created_at)}
                              </span>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => deleteTask(task)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                          aria-label="Delete task"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Your tasks sync to your account and show on the Dashboard “Today’s
              Tasks” widget.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default withAuthProtection(TasksPage);
