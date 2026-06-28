import type { Recent } from "../types";

const RECENTS_KEY = "aspect.recents";
const FLAGS_KEY = "aspect.flags";
const MAX_RECENTS = 24;

// ---- recently opened folders ----

export function getRecents(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecent(r: Recent): void {
  const list = getRecents().filter((x) => x.path !== r.path);
  list.unshift(r);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
}

export function removeRecent(path: string): void {
  localStorage.setItem(
    RECENTS_KEY,
    JSON.stringify(getRecents().filter((x) => x.path !== path)),
  );
}

// ---- flagged images (keyed by absolute path, persists across folders) ----

export function getFlags(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeFlags(flags: Set<string>): void {
  const obj: Record<string, true> = {};
  for (const p of flags) obj[p] = true;
  localStorage.setItem(FLAGS_KEY, JSON.stringify(obj));
}
