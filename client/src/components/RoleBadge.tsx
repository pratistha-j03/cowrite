import type { Role } from "../types";

const styles: Record<Role, string> = {
  owner: "bg-sage text-[#0d1821]",
  editor: "bg-sky text-ink",
  viewer: "border border-line text-muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`eyebrow px-2 py-1 text-[0.68rem] ${styles[role]}`}>{role}</span>;
}