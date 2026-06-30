import type { Recent } from "../types";

const RECENTS_KEY = "aspect.recents";
const FLAGS_KEY = "aspect.flags";
const PINNED_KEY = "aspect.pinned";
const IMAGES_ONLY_KEY = "aspect.imagesOnly";
const DENSITY_KEY = "aspect.density";
const MAX_RECENTS = 24;

export type Density = "s" | "m" | "l";

// ---- view preferences ----

export function getImagesOnly(): boolean {
  const v = localStorage.getItem(IMAGES_ONLY_KEY);
  return v === null ? true : v === "1"; // default on
}

export function setImagesOnly(on: boolean): void {
  localStorage.setItem(IMAGES_ONLY_KEY, on ? "1" : "0");
}

export function getDensity(): Density {
  const v = localStorage.getItem(DENSITY_KEY);
  return v === "s" || v === "l" ? v : "m";
}

export function setDensity(d: Density): void {
  localStorage.setItem(DENSITY_KEY, d);
}

export type SortKey = "name" | "date" | "size" | "type";
export type SortDir = "asc" | "desc";
export interface SortPref {
  key: SortKey;
  dir: SortDir;
}
export type TypeFilter = "all" | "photos" | "raw";

const SORT_KEY = "aspect.sort";
const TYPE_KEY = "aspect.typeFilter";

export function getSort(): SortPref {
  try {
    const v = JSON.parse(localStorage.getItem(SORT_KEY) || "null");
    if (v && typeof v.key === "string" && typeof v.dir === "string") return v;
  } catch {
    /* ignore */
  }
  return { key: "name", dir: "asc" };
}

export function setSort(s: SortPref): void {
  localStorage.setItem(SORT_KEY, JSON.stringify(s));
}

export function getTypeFilter(): TypeFilter {
  const v = localStorage.getItem(TYPE_KEY);
  return v === "photos" || v === "raw" ? v : "all";
}

export function setTypeFilter(t: TypeFilter): void {
  localStorage.setItem(TYPE_KEY, t);
}

// ---- pinned folders (Quick access) ----

export interface Pinned {
  path: string;
  name: string;
}

export function getPinned(): Pinned[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writePinned(list: Pinned[]): void {
  localStorage.setItem(PINNED_KEY, JSON.stringify(list));
}

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
