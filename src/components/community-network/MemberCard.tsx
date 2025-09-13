import React from "react";

export type Member = {
  user_id: string;
  display_name: string;
  year_of_study: string | null;
  allow_dm: boolean | null;
  presence_status: "online" | "offline" | string;
};

const PresenceDot = ({ status }: { status: string }) => (
  <span
    aria-label={status}
    title={status}
    className={`inline-block h-2.5 w-2.5 rounded-full ${
      status === "online" ? "bg-green-500" : "bg-gray-400"
    }`}
  />
);

export default function MemberCard({ member }: { member: Member }) {
  const year = member.year_of_study || "-";

  return (
    <div className="rounded-lg border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <PresenceDot status={member.presence_status} />
        <div>
          <div className="font-semibold">{member.display_name}</div>
          <div className="text-xs text-gray-600">Year: {year}</div>
        </div>
      </div>

      <button
        className={`text-xs rounded px-2 py-1 border ${
          member.allow_dm ? "" : "opacity-50 cursor-not-allowed"
        }`}
        disabled={!member.allow_dm}
        onClick={() => {
          // Later: router.push(`/dm/${member.user_id}`)
          alert(
            member.allow_dm
              ? "DM will open here (hook to /dm/[userId])."
              : "This member isn't accepting private messages."
          );
        }}
      >
        Message
      </button>
    </div>
  );
}
