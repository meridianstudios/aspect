import { useEffect, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listDir, listFiles } from "../lib/api";
import type { DirListing, ImageEntry } from "../types";
import {
  getImagesOnly,
  setImagesOnly,
  getTypeFilter,
  setTypeFilter,
  type TypeFilter,
} from "../lib/store";
import {
  Folder,
  FolderOpen,
  ArrowUp,
  ChevronRight,
  Picture,
  FileIcon,
} from "../lib/icons";
import { baseName, crumbs, fmtSize } from "../lib/util";
import FilterMenu from "./FilterMenu";

export default function Browser({
  path,
  onNavigate,
  onOpen,
  onOpenViewer,
}: {
  path: string | null;
  onNavigate: (path: string) => void;
  onOpen: (path: string, name: string) => void;
  onOpenViewer: (images: ImageEntry[], index: number) => void;
}) {
  const [listing, setListing] = useState<DirListing | null>(null);
  const [files, setFiles] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagesOnly, setImagesOnlyState] = useState(getImagesOnly());
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>(getTypeFilter());

  useEffect(() => {
    if (path === null) {
      setListing(null);
      setFiles([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([listDir(path), listFiles(path)])
      .then(([l, fs]) => {
        if (!alive) return;
        setListing(l);
        setFiles(fs);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
        setListing(null);
        setFiles([]);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  const pickNative = async () => {
    const sel = await openDialog({ directory: true, title: "Choose a folder" });
    if (typeof sel === "string") onNavigate(sel);
  };

  const toggleImagesOnly = () => {
    const v = !imagesOnly;
    setImagesOnlyState(v);
    setImagesOnly(v);
  };
  const chooseType = (t: TypeFilter) => {
    setTypeFilterState(t);
    setTypeFilter(t);
  };

  const visibleFiles = useMemo(() => {
    let list = files;
    if (typeFilter === "raw") list = list.filter((f) => f.raw);
    else if (typeFilter === "photos") list = list.filter((f) => f.image && !f.raw);
    else if (imagesOnly) list = list.filter((f) => f.image);
    return list;
  }, [files, imagesOnly, typeFilter]);

  const imageFiles = useMemo(
    () => visibleFiles.filter((f) => f.image),
    [visibleFiles],
  );

  const openImage = (f: ImageEntry) => {
    const i = imageFiles.findIndex((im) => im.path === f.path);
    if (i >= 0) onOpenViewer(imageFiles, i);
  };

  return (
    <div className="view">
      <header className="cbar">
        {path !== null && (
          <>
            <button
              className="iconbtn"
              disabled={!listing?.parent}
              title="Up one level"
              onClick={() => listing?.parent && onNavigate(listing.parent)}
            >
              <ArrowUp size={18} />
            </button>
            <div className="crumbs">
              {crumbs(path).map((c, i, a) => (
                <span key={c.path} className="crumb-seg">
                  <button className="crumb" onClick={() => onNavigate(c.path)}>
                    {c.name}
                  </button>
                  {i < a.length - 1 && (
                    <span className="crumb-sep">
                      <ChevronRight size={14} />
                    </span>
                  )}
                </span>
              ))}
            </div>
          </>
        )}
        {path === null && <h1 className="cbar-title">Browse</h1>}
        <div className="spacer" />
        {path !== null && (
          <FilterMenu
            imagesOnly={imagesOnly}
            onImagesOnly={toggleImagesOnly}
            typeFilter={typeFilter}
            onType={chooseType}
          />
        )}
        <button className="btn ghost" onClick={pickNative}>
          System dialog
        </button>
      </header>

      {path === null ? (
        <div className="browse-hint">
          <Picture size={40} />
          <h2>Pick a drive or folder</h2>
          <p className="muted">
            Choose a location from the left to explore its folders. Memory cards
            show up under Drives and cards.
          </p>
        </div>
      ) : (
        <div className="page">
          {listing && listing.image_count > 0 && (
            <button
              className="open-banner"
              onClick={() => onOpen(path, baseName(path))}
            >
              <span className="ob-ico">
                <FolderOpen size={22} />
              </span>
              <span className="ob-text">
                <b>
                  Open {listing.image_count} photo
                  {listing.image_count === 1 ? "" : "s"} in the gallery
                </b>
                <span className="muted">
                  grid view with sort, fullscreen and export
                </span>
              </span>
              <span className="ob-go">
                Open <ChevronRight size={16} />
              </span>
            </button>
          )}

          {loading ? (
            <div className="loading">Loading…</div>
          ) : error ? (
            <div className="error">Could not open this folder. {error}</div>
          ) : (
            listing && (
              <div className="explore-list">
                {listing.folders.map((f) => (
                  <button
                    key={f.path}
                    className="folder-row"
                    onClick={() => onNavigate(f.path)}
                  >
                    <Folder size={18} />
                    <span className="folder-row-name">{f.name}</span>
                    <span className="folder-row-go">
                      <ChevronRight size={16} />
                    </span>
                  </button>
                ))}

                {visibleFiles.map((f) =>
                  f.image ? (
                    <button
                      key={f.path}
                      className="file-row image"
                      onClick={() => openImage(f)}
                      title="Open"
                    >
                      <Picture size={18} />
                      <span className="file-row-name">{f.name}</span>
                      {f.raw && <span className="raw-tag">RAW</span>}
                      <span className="file-row-size">{fmtSize(f.size)}</span>
                    </button>
                  ) : (
                    <div key={f.path} className="file-row">
                      <FileIcon size={18} />
                      <span className="file-row-name">{f.name}</span>
                      <span className="file-row-size">{fmtSize(f.size)}</span>
                    </div>
                  ),
                )}

                {listing.folders.length === 0 && visibleFiles.length === 0 && (
                  <div className="muted pad">
                    {files.length > 0
                      ? "No images here. Turn off the filter to see other files."
                      : "This folder is empty."}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
