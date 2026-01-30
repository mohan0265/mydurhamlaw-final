import { useUserModules, UserModule } from "@/hooks/useUserModules";
import { Loader2 } from "lucide-react";

interface UserModulesSelectProps {
  selectedModuleId: string | undefined;
  onSelect: (module: UserModule | null) => void;
  className?: string;
  required?: boolean;
}

export default function UserModulesSelect({
  selectedModuleId,
  onSelect,
  className = "",
  required = false,
}: UserModulesSelectProps) {
  const { modules, loading } = useUserModules();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading modules...</span>
      </div>
    );
  }

  // If no modules found, maybe suggest adding some?
  // For now just render the select.

  return (
    <select
      value={selectedModuleId || ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "manual") {
          onSelect(null); // Signal manual entry
        } else {
          const mod = modules.find((m) => m.user_module_id === val);
          onSelect(mod || null);
        }
      }}
      className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
      required={required}
    >
      <option value="">-- Select a Module --</option>
      {modules.map((m) => (
        <option key={m.user_module_id} value={m.user_module_id}>
          {m.module_code} - {m.module_title}
        </option>
      ))}
      <option disabled>──────────</option>
      <option value="manual">Enter Manually...</option>
    </select>
  );
}
