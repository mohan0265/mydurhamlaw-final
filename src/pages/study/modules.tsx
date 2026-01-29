import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Plus, Edit2, Archive, Trash2, ArrowLeft } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import Select from "react-select"; // Using react-select for catalog search

export default function ManageModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);

  // Modal State
  const [catalogOptions, setCatalogOptions] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(
    null,
  );
  const [isCustom, setIsCustom] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [staffNames, setStaffNames] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserModules();
      fetchCatalog();
    }
  }, [user]);

  const fetchUserModules = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_modules")
      .select("*, module_catalog(*)")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load modules");
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  const fetchCatalog = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("module_catalog")
      .select("*")
      .order("code");

    if (data) {
      setCatalogOptions(
        data.map((m) => ({
          value: m.id,
          label: `${m.code} - ${m.title}`,
          original: m,
        })),
      );
    }
  };

  const resetForm = () => {
    setEditingModule(null);
    setSelectedCatalogItem(null);
    setIsCustom(false);
    setCustomCode("");
    setCustomName("");
    setStaffNames([""]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (mod: any) => {
    setEditingModule(mod);
    // Prefill
    if (mod.module_catalog) {
      setIsCustom(false);
      setSelectedCatalogItem({
        value: mod.module_catalog.id,
        label: `${mod.module_catalog.code} - ${mod.module_catalog.title}`,
        original: mod.module_catalog,
      });
    } else {
      setIsCustom(true);
      // Fallbacks for custom logic if implemented fully
      setCustomCode("CUSTOM"); // or parse from display if stored? Assuming user_modules structure update
    }

    // Parse staff names
    let staffs = mod.staff_names;
    // Migration fallback for old lecturer field:
    if (!staffs || staffs.length === 0) {
      if (mod.lecturer) staffs = [mod.lecturer];
      else staffs = [""];
    }
    // If it's a string (old format), wrap it. Ideally DB is jsonb array now.
    if (typeof staffs === "string") staffs = [staffs];
    if (!staffs || staffs.length === 0) staffs = [""];

    setStaffNames(staffs);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const supabase = getSupabaseClient();

    // Prepare staff list: trim and remove empty
    const cleanStaff = staffNames
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // Compute display
    let staffDisplay = null;
    if (cleanStaff.length === 1) staffDisplay = cleanStaff[0];
    else if (cleanStaff.length === 2)
      staffDisplay = `${cleanStaff[0]}, ${cleanStaff[1]}`;
    else if (cleanStaff.length > 2)
      staffDisplay = `${cleanStaff[0]} + ${cleanStaff.length - 1} more`;

    const payload: any = {
      user_id: user?.id,
      staff_names: cleanStaff,
      staff_display: staffDisplay,
      is_active: true,
    };

    if (isCustom) {
      // Handle custom module logic if table supports it (requires schema update for custom_code/name in user_modules?)
      // The prompt implies we should store catalog_id mostly.
      // For now, let's assume we force catalog usage OR rely on existing logic.
      // If we strictly follow "Single Source", we should probably link to catalog.
      // But if user wants custom, we might need columns.
      // Assuming current schema relies on catalog.
      // Force catalog selection for v1 to be safe, or allow "CUSTOM" logic if DB handles it.
      // Let's stick to catalog for robustness first.
      if (!selectedCatalogItem) {
        toast.error("Please select a module from the list.");
        setSubmitting(false);
        return;
      }
      payload.catalog_id = selectedCatalogItem.value;
    } else {
      if (!selectedCatalogItem) {
        toast.error("Please select a module.");
        setSubmitting(false);
        return;
      }
      payload.catalog_id = selectedCatalogItem.value;
    }

    let error;
    if (editingModule) {
      const { error: err } = await supabase
        .from("user_modules")
        .update(payload)
        .eq("id", editingModule.id);
      error = err;
    } else {
      // Check for duplicate
      const { data: existing } = await supabase
        .from("user_modules")
        .select("id")
        .eq("catalog_id", payload.catalog_id)
        .eq("user_id", user?.id)
        .maybeSingle();
      if (existing) {
        // If duplicate, maybe reactivate if was archived?
        const { error: err } = await supabase
          .from("user_modules")
          .update({ ...payload, is_active: true })
          .eq("id", existing.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("user_modules")
          .insert(payload);
        error = err;
      }
    }

    if (error) {
      toast.error("Failed to save module");
      console.error(error);
    } else {
      toast.success("Module saved!");
      setShowModal(false);
      fetchUserModules();
    }
    setSubmitting(false);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Remove this module from your active list?")) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("user_modules")
      .update({ is_active: false })
      .eq("id", id);
    if (error) toast.error("Failed to remove");
    else {
      toast.success("Module removed");
      fetchUserModules();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm mb-2"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Modules
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add your modules and lecturers once. Then pick them instantly when
              uploading lectures.
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Plus size={20} /> Add Module
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading modules...
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No modules yet
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Start by adding the modules you are studying this year. You'll be
              able to attach lectures and assignments to them.
            </p>
            <Button
              onClick={handleOpenAdd}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Add Your First Module
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition group relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded mb-1">
                      {mod.module_catalog?.code || "CUSTOM"}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                      {mod.module_catalog?.title || "Unknown Module"}
                    </h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(mod)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleArchive(mod.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="font-medium text-xs uppercase text-gray-400 tracking-wider mb-1">
                    Teaching Staff
                  </div>
                  {mod.staff_display ? (
                    <div className="flex items-center gap-2">
                      {mod.staff_display}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">No staff added</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingModule ? "Edit Module" : "Add Module"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Module Selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={catalogOptions}
                    value={selectedCatalogItem}
                    onChange={setSelectedCatalogItem}
                    isDisabled={!!editingModule} // Lock module on edit to avoid complications
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    placeholder="Search e.g. Contract Law..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#e2e8f0",
                        borderRadius: "0.5rem",
                        padding: "2px",
                        "&:hover": { borderColor: "#a855f7" },
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                  />
                  {editingModule && (
                    <p className="text-xs text-gray-400 mt-1">
                      To change module, add a new one instead.
                    </p>
                  )}
                </div>

                {/* Staff List */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Teaching Staff (Lecturers / Tutors)
                  </label>
                  <div className="space-y-2">
                    {staffNames.map((name, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...staffNames];
                            newNames[idx] = e.target.value;
                            setStaffNames(newNames);
                          }}
                          placeholder={
                            idx === 0
                              ? "e.g. Prof. Albus Dumbledore"
                              : "Another staff name..."
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-800 dark:text-white"
                        />
                        {staffNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setStaffNames(
                                staffNames.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaffNames([...staffNames, ""])}
                    className="mt-2 text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add another staff member
                  </button>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Module"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Simple X icon component for modal (since lucide X was allocated to Archive/Edit above context)
function X({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
