import { useCallback, useEffect, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listDir, listFiles, listVolumes } from "../lib/api";
import type { DirListing, ImageEntry, Volume } from "../types";
import {
  getImagesOnly,
  setImagesOnly,
  getTypeFilter,
  setTypeFilter,
  type TypeFilter,
} from "../lib/store";
import {
  Logo,
  Home as HomeIcon,
  Drive,
  Card,
  Folder,
  FolderOpen,
  ArrowUp,
  ChevronRight,
  Picture,
  FileIcon,
  FlagFill,
  Export,
} from "../lib/icons";
import { baseName, crumbs, fmtSize } from "../lib/util";
import FilterMenu from "./FilterMenu";

export default function Browser({
  initialPath,
  flagCount,
  onHome,
  onOpen,
  onOpenViewer,
  onExportAll,
}: {
  initialPath?: string;
  flagCount: number;
  onHome: () => void;
  onOpen: (path: string, name: string) => void;
  onOpenViewer: (images: ImageEntry[], index: number) => void;
  onExportAll: () => void;
}) {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [path, setPath] = useState<string | null>(null);
  const [listing, setListing] = useState<DirListing | null>(null);
  const [files, setFiles] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagesOnly, setImagesOnlyState] = useState(getImagesOnly());
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>(getTypeFilter());

  useEffect(() => {
    listVolumes().then(setVolumes).catch(() => {});
  }, []);

  const navigate = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    setPath(p);
    try {
      const [l, fs] = await Promise.all([listDir(p), listFiles(p)]);
      setListing(l);
      setFiles(fs);
    } catch (e) {
      setError(String(e));
      setListing(null);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPath) navigate(initialPath);
  }, [initialPath, navigate]);

  const pickNative = async () => {
    const sel = await openDialog({ directory: true, title: "Choose a folder" });
    if (typeof sel === "string") navigate(sel);
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

  const quick = volumes.filter((v) => v.kind === "quick");
  const drives = volumes.filter((v) => v.kind !== "quick");

  return (
    <div className="view browse">
      <header className="topbar">
        <div className="brand" role="button" onClick={onHome}>
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <button className="btn ghost" onClick={onHome}>
          <HomeIcon size={16} /> Home
        </button>
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

      <div className="browse-body">
        <aside className="rail">
          <div className="rail-group">
            <div className="rail-title">Quick access</div>
            {quick.map((v) => (
              <button
                key={v.path}
                className={"rail-item" + (path === v.path ? " on" : "")}
                onClick={() => navigate(v.path)}
              >
                <Folder size={16} />
                <span>{v.name}</span>
              </button>
            ))}
          </div>
          <div className="rail-group">
            <div className="rail-title">Drives and cards</div>
            {drives.map((v) => (
              <button
                key={v.path}
                className={"rail-item" + (path === v.path ? " on" : "")}
                onClick={() => navigate(v.path)}
              >
                {v.kind === "removable" ? <Card size={16} /> : <Drive size={16} />}
                <span className="rail-vol">
                  <span className="rail-vol-name">{v.name}</span>
                  {v.total > 0 && (
                    <span className="rail-vol-sub">{fmtSize(v.free)} free</span>
                  )}
                </span>
              </button>
            ))}
            {volumes.length === 0 && (
              <div className="rail-empty muted">
                Drives appear when running the app.
              </div>
            )}
          </div>
        </aside>

        <main className="browse-main">
          {path === null ? (
            <div className="browse-hint">
              <Picture size={40} />
              <h2>Pick a drive or folder</h2>
              <p className="muted">
                Choose a location on the left to explore its folders. Memory
                cards show up under Drives and cards.
              </p>
            </div>
          ) : (
            <>
              <div className="crumbbar">
                <button
                  className="iconbtn"
                  disabled={!listing?.parent}
                  title="Up one level"
                  onClick={() => listing?.parent && navigate(listing.parent)}
                >
                  <ArrowUp size={18} />
                </button>
                <div className="crumbs">
                  {crumbs(path).map((c, i, a) => (
                    <span key={c.path} className="crumb-seg">
                      <button className="crumb" onClick={() => navigate(c.path)}>
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
              </div>

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
                        onClick={() => navigate(f.path)}
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

                    {listing.folders.length === 0 &&
                      visibleFiles.length === 0 && (
                        <div className="muted pad">
                          {files.length > 0
                            ? "No images here. Turn off the filter to see other files."
                            : "This folder is empty."}
                        </div>
                      )}
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>

      <div className="statusbar">
        <span className="sb-item">
          <FlagFill size={14} /> {flagCount} flagged
        </span>
        <div className="spacer" />
        <button
          className="btn primary sm"
          disabled={flagCount === 0}
          onClick={onExportAll}
        >
          <Export size={15} /> Export flagged
        </button>
      </div>
    </div>
  );
}
