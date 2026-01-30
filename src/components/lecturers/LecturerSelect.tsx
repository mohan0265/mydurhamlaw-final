import { useLecturers } from "@/hooks/useLecturers";
import { useUserModules } from "@/hooks/useUserModules";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface LecturerSelectProps {
  selectedName: string;
  onSelect: (name: string | null) => void;
  moduleId?: string; // user_module_id
  className?: string;
}

export default function LecturerSelect({
  selectedName,
  onSelect,
  moduleId,
  className = "",
}: LecturerSelectProps) {
  const { lecturers, loading: loadingLecturers } = useLecturers();
  const { modules, loading: loadingModules } = useUserModules();

  const suggestedStaff = useMemo(() => {
    if (!moduleId || loadingModules) return [];
    const mod = modules.find((m) => m.user_module_id === moduleId);
    return mod?.staff_names || [];
  }, [moduleId, modules, loadingModules]);

  const otherLecturers = useMemo(() => {
    const suggestedSet = new Set(suggestedStaff);
    return lecturers.filter((l) => !suggestedSet.has(l.name));
  }, [lecturers, suggestedStaff]);

  if (loadingLecturers) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading lecturers...</span>
      </div>
    );
  }

  return (
    <select
      value={selectedName || ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "manual") {
          onSelect(null); // Signal manual entry
        } else {
          onSelect(val);
        }
      }}
      className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
    >
      <option value="">-- Select Lecturer --</option>

      {/* Suggested Staff (if any) */}
      {suggestedStaff.length > 0 && (
        <optgroup label="Suggested for Module">
          {suggestedStaff.map((name, i) => (
            <option key={`staff-${i}`} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
      )}

      {/* All Lecturers */}
      <optgroup label="All Lecturers">
        {otherLecturers.map((l) => (
          <option key={l.id} value={l.name}>
            {l.name}
          </option>
        ))}
      </optgroup>

      <option disabled>──────────</option>
      <option value="manual">Enter Manually...</option>
    </select>
  );
}
