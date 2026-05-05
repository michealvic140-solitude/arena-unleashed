import type { AppRole } from "@/lib/auth";

const LABELS: Record<AppRole, string> = {
  admin: "Admin",
  moderator: "Mod",
  gang_leader: "Gang Leader",
  shooter: "Shooter",
  registered: "Registered",
  viewer: "Viewer",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span className={`role-${role} inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
      {LABELS[role]}
    </span>
  );
}
