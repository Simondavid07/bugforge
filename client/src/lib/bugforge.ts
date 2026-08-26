export const statusMeta = {
  intake: { label: "Intake", className: "bg-[#ffe66d] text-black" },
  triage: { label: "Triage", className: "bg-[#d9c8ff] text-black" },
  in_progress: { label: "In progress", className: "bg-[#9de7d3] text-black" },
  verify: { label: "Verify", className: "bg-[#ffd0bb] text-black" },
  done: { label: "Done", className: "bg-[#dce9ff] text-black" },
} as const;

export const severityMeta = {
  blocker: { label: "Blocker", className: "bg-[#ff6a4d] text-black" },
  critical: { label: "Critical", className: "bg-[#ffaf7a] text-black" },
  major: { label: "Major", className: "bg-[#ffe66d] text-black" },
  minor: { label: "Minor", className: "bg-[#9de7d3] text-black" },
  trivial: { label: "Trivial", className: "bg-[#d9c8ff] text-black" },
} as const;

export function humanize(value: string | null | undefined) {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

export function relativeTime(value: Date | string | number) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function initials(name?: string | null) {
  return (name ?? "?").split(" ").filter(Boolean).slice(0, 2).map(piece => piece[0]).join("").toUpperCase();
}
