export type VolumeKind = "quick" | "drive" | "removable";

export interface Volume {
  name: string;
  path: string;
  kind: VolumeKind;
  total: number;
  free: number;
}

export interface FolderEntry {
  name: string;
  path: string;
}

export interface DirListing {
  path: string;
  parent: string | null;
  folders: FolderEntry[];
  image_count: number;
}

export interface ImageEntry {
  name: string;
  path: string;
  size: number;
  modified: number;
  image: boolean;
  raw: boolean;
}

export interface ExportResult {
  copied: number;
  failed: string[];
  dest: string;
}

export interface Recent {
  path: string;
  name: string;
  openedAt: number;
  count: number;
}

export interface ConvertResult {
  converted: number;
  failed: string[];
  dest: string;
}

export interface ImageInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
  format: string;
  width: number | null;
  height: number | null;
  taken: string | null;
  camera: string | null;
  lens: string | null;
  iso: string | null;
  aperture: string | null;
  shutter: string | null;
  focal: string | null;
  gps: string | null;
}
