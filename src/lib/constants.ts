import type { Priority } from "@/db/schema";

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "none", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PRIORITY_COLORS: Record<Priority, string> = {
  none: "#6b5d49",
  low: "#7c9fb8",
  medium: "#e0a32e",
  high: "#ff7a47",
  urgent: "#ff4d3d",
};

export const DEFAULT_COLUMNS = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Done",
] as const;

const COLUMN_PALETTE = [
  "#9c8d75",
  "#7c9fb8",
  "#ff5a24",
  "#a98ae0",
  "#7ba05b",
  "#e5608f",
  "#e8a33c",
];

export function columnAccent(name: string, index = 0): string {
  const n = name.toLowerCase();
  if (n.includes("backlog")) return "#9c8d75";
  if (n.includes("todo") || n.includes("to do")) return "#7c9fb8";
  if (n.includes("progress")) return "#ff5a24";
  if (n.includes("review")) return "#a98ae0";
  if (n.includes("done") || n.includes("complete")) return "#7ba05b";
  return COLUMN_PALETTE[index % COLUMN_PALETTE.length];
}

export function isDoneColumn(name: string) {
  const n = name.toLowerCase();
  return n.includes("done") || n.includes("complete") || n.includes("ship");
}

/** Editorial palette — vermilion, ochre, olive, dusty blue, orchid, rose. */
export const PROJECT_COLORS = [
  "#FF5A24",
  "#E8A33C",
  "#7BA05B",
  "#7C9FB8",
  "#A98AE0",
  "#E5608F",
  "#D97757",
  "#B8AC5C",
];

export const LABEL_PRESETS = [
  { name: "Bug", color: "#ff4d3d" },
  { name: "Feature", color: "#a98ae0" },
  { name: "Improvement", color: "#7c9fb8" },
  { name: "Design", color: "#e5608f" },
  { name: "Docs", color: "#9c8d75" },
];

export const AVATAR_COLORS = [
  "#FF5A24",
  "#E8A33C",
  "#7BA05B",
  "#7C9FB8",
  "#A98AE0",
  "#E5608F",
  "#D97757",
  "#C2B280",
];
