import { invoke } from "@tauri-apps/api/core";
import type { Volume, DirListing, ImageEntry, ExportResult } from "../types";

// True when running inside the Tauri webview (false in a plain browser preview).
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Tauri exposes custom protocols as `aspect://localhost` on macOS/Linux and
// `http://aspect.localhost` on Windows.
const isWin =
  typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");
const IMG_BASE = isWin ? "http://aspect.localhost/" : "aspect://localhost/";

/** URL for an image. Pass `thumb` (px) for a downscaled JPEG thumbnail. */
export function imageUrl(path: string, thumb?: number): string {
  const u = `${IMG_BASE}img?path=${encodeURIComponent(path)}`;
  return thumb ? `${u}&t=${thumb}` : u;
}

export async function listVolumes(): Promise<Volume[]> {
  if (!isTauri) return [];
  return invoke<Volume[]>("list_volumes");
}

export async function listDir(path: string): Promise<DirListing> {
  return invoke<DirListing>("list_dir", { path });
}

export async function listFiles(path: string): Promise<ImageEntry[]> {
  return invoke<ImageEntry[]>("list_files", { path });
}

export async function exportFlagged(
  paths: string[],
  dest: string,
): Promise<ExportResult> {
  return invoke<ExportResult>("export_flagged", { paths, dest });
}

export async function openFolder(path: string): Promise<void> {
  return invoke("open_folder", { path });
}
