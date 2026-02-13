export type ViewMode = "founder" | "user";

export function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "user";
  const v = window.localStorage.getItem("sq_view_mode");
  return v === "founder" ? "founder" : "user";
}

export function setStoredViewMode(mode: ViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sq_view_mode", mode);
}
