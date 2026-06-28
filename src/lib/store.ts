import type { Recent } from "../types";

const RECENTS_KEY = "aspect.recents";
const FLAGS_KEY = "aspect.flags";
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
