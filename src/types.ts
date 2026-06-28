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
