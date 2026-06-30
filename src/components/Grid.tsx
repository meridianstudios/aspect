import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { imageUrl, listFiles } from "../lib/api";
import type { ImageEntry } from "../types";
import {
  getDensity,
  setDensity,
  getImagesOnly,
  setImagesOnly,
  getSort,
  setSort,
  getTypeFilter,
  setTypeFilter,
  type Density,
  type SortKey,
  type SortDir,
  type SortPref,
  type TypeFilter,
} from "../lib/store";
import {
  FolderOpen,
  Flag,
  FlagFill,
  Export,
  ChevronLeft,
  ChevronDown,
  Picture,
  FileIcon,
  Sort as SortIcon,
} from "../lib/icons";
import Dropdown from "./Dropdown";
import FilterMenu from "./FilterMenu";

const THUMB = 360;

const SORT_LABEL: Record<SortKey, string> = {
  name: "Name",
  date: "Date",
  size: "Size",
  type: "Type",
};
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  name: "asc",
  date: "desc",
  size: "desc",
  type: "asc",
};

const collate = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const extOf = (n: string) => {
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i + 1).toLowerCase() : "";
};

function applySort(arr: ImageEntry[], key: SortKey, dir: SortDir): ImageEntry[] {
  const m = dir === "asc" ? 1 : -1;
  const out = [...arr];
  out.sort((a, b) => {
    let r = 0;
    if (key === "name") r = collate(a.name, b.name);
    else if (key === "date") r = a.modified - b.modified;
    else if (key === "size") r = a.size - b.size;
    else r = collate(extOf(a.name), extOf(b.name)) || collate(a.name, b.name);
    return r * m;
  });
  return out;
}

export default function Grid({
  path,
  name,
  flags,
  onToggleFlag,
  onBack,
  onOpenViewer,
  onExport,
  onClearFlags,
  onImageContext,
  onLoaded,
}: {
  path: string;
  name: string;
  flags: Set<string>;
  onToggleFlag: (p: string) => void;
  onBack: () => void;
  onOpenViewer: (images: ImageEntry[], index: number) => void;
  onExport: (images: ImageEntry[]) => void;
  onClearFlags: (paths: string[]) => void;
  onImageContext: (e: React.MouseEvent, path: string) => void;
  onLoaded: (path: string, name: string, count: number) => void;
}) {
  const [files, setFiles] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [density, setDensityState] = useState<Density>(getDensity());
  const [imagesOnly, setImagesOnlyState] = useState(getImagesOnly());
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>(getTypeFilter());
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sort, setSortState] = useState<SortPref>(getSort());
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    listFiles(path)
      .then((fs) => {
        setFiles(fs);
        setLoading(false);
        onLoaded(path, name, fs.filter((f) => f.image).length);
      })
      .catch(() => {
        setFiles([]);
        setLoading(false);
      });
  }, [path, name, onLoaded]);

  const allImages = useMemo(() => files.filter((f) => f.image), [files]);

  const filtered = useMemo(() => {
    let list = files;
    if (typeFilter === "raw") list = list.filter((f) => f.raw);
    else if (typeFilter === "photos") list = list.filter((f) => f.image && !f.raw);
    else if (imagesOnly) list = list.filter((f) => f.image);
    if (flaggedOnly) list = list.filter((f) => flags.has(f.path));
    return list;
  }, [files, typeFilter, imagesOnly, flaggedOnly, flags]);

  const visible = useMemo(
    () => applySort(filtered, sort.key, sort.dir),
    [filtered, sort],
  );
  const visibleImages = useMemo(() => visible.filter((f) => f.image), [visible]);

  const flaggedCount = useMemo(
    () => allImages.reduce((n, im) => n + (flags.has(im.path) ? 1 : 0), 0),
    [allImages, flags],
  );

  useEffect(
    () => setSel(0),
    [path, imagesOnly, typeFilter, flaggedOnly, sort],
  );

  const toggleImagesOnly = () => {
    const v = !imagesOnly;
    setImagesOnlyState(v);
    setImagesOnly(v);
  };
  const chooseType = (t: TypeFilter) => {
    setTypeFilterState(t);
    setTypeFilter(t);
  };
  const chooseDensity = (d: Density) => {
    setDensityState(d);
    setDensity(d);
  };
  const DENS_ORDER: Density[] = ["s", "m", "l"];
  const stepDensity = (dir: number) => {
    const i = Math.min(2, Math.max(0, DENS_ORDER.indexOf(density) + dir));
    chooseDensity(DENS_ORDER[i]);
  };
  const chooseSort = (k: SortKey) => {
    setSortState((prev) => {
      const next: SortPref =
        prev.key === k
          ? { key: k, dir: prev.dir === "asc" ? "desc" : "asc" }
          : { key: k, dir: DEFAULT_DIR[k] };
      setSort(next);
      return next;
    });
  };

  const clearFlags = async () => {
    if (flaggedCount === 0) return;
    const ok = await confirm(
      `Clear all ${flaggedCount} flag${flaggedCount === 1 ? "" : "s"} in this folder?`,
      { title: "Clear flags", kind: "warning" },
    );
    if (ok) onClearFlags(allImages.map((im) => im.path));
  };

  const openImage = useCallback(
    (file: ImageEntry) => {
      const idx = visibleImages.findIndex((im) => im.path === file.path);
      if (idx >= 0) onOpenViewer(visibleImages, idx);
    },
    [visibleImages, onOpenViewer],
  );

  const colCount = useCallback(() => {
    const g = gridRef.current;
    if (!g) return 1;
    const cols = getComputedStyle(g).gridTemplateColumns.split(" ");
    return Math.max(1, cols.filter((c) => c && c !== "none").length);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (visible.length === 0) return;
      const cols = colCount();
      if (e.key === "ArrowRight") {
        setSel((s) => Math.min(visible.length - 1, s + 1));
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setSel((s) => Math.max(0, s - 1));
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setSel((s) => Math.min(visible.length - 1, s + cols));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setSel((s) => Math.max(0, s - cols));
        e.preventDefault();
      } else if (e.key === "Enter") {
        const f = visible[sel];
        if (f?.image) openImage(f);
      } else if (e.key === "f" || e.key === "F") {
        const f = visible[sel];
        if (f?.image) onToggleFlag(f.path);
      } else if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        stepDensity(1);
      } else if (e.ctrlKey && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        stepDensity(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sel, colCount, openImage, onToggleFlag, density]);

  // Ctrl + mouse wheel zooms thumbnail size (native non-passive listener so we
  // can preventDefault the webview's page zoom).
  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        stepDensity(e.deltaY < 0 ? 1 : -1);
      }
    };
    g.addEventListener("wheel", onWheel, { passive: false });
    return () => g.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density]);

  useEffect(() => {
    const el = gridRef.current?.children[sel] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const shown = visibleImages.length;
  const countText =
    shown === allImages.length
      ? `${allImages.length} photo${allImages.length === 1 ? "" : "s"}`
      : `${shown} of ${allImages.length} photos`;

  return (
    <div className="view grid-view">
      <header className="cbar">
        <button className="iconbtn" title="Back to folder" onClick={onBack}>
          <ChevronLeft size={18} />
        </button>
        <div className="grid-title">
          <FolderOpen size={16} />
          <span className="gt-name" title={path}>
            {name}
          </span>
        </div>
        <span className="count-pill">{countText}</span>
        <div className="spacer" />

        <FilterMenu
          imagesOnly={imagesOnly}
          onImagesOnly={toggleImagesOnly}
          typeFilter={typeFilter}
          onType={chooseType}
          flaggedOnly={flaggedOnly}
          onFlaggedOnly={() => setFlaggedOnly((v) => !v)}
        />

        <Dropdown
          label={`Sort: ${SORT_LABEL[sort.key]}`}
          icon={<SortIcon size={15} />}
          align="right"
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <button
              key={k}
              className={"menu-item" + (sort.key === k ? " on" : "")}
              onClick={() => chooseSort(k)}
            >
              {SORT_LABEL[k]}
              {sort.key === k && (
                <span className="menu-dir">
                  <ChevronDown
                    size={13}
                    style={{
                      transform:
                        sort.dir === "asc" ? "rotate(180deg)" : "none",
                    }}
                  />
                </span>
              )}
            </button>
          ))}
        </Dropdown>

        <div className="seg" role="group" aria-label="Thumbnail size">
          {(["s", "m", "l"] as Density[]).map((d) => (
            <button
              key={d}
              className={"seg-btn" + (density === d ? " on" : "")}
              onClick={() => chooseDensity(d)}
              title={d === "s" ? "Small" : d === "m" ? "Medium" : "Large"}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        {flaggedCount > 0 && (
          <button className="btn ghost" onClick={clearFlags} title="Unflag all in this folder">
            Clear flags
          </button>
        )}
        <button
          className="btn primary"
          disabled={flaggedCount === 0}
          onClick={() => onExport(allImages)}
        >
          <Export size={16} />
          {flaggedCount > 0 ? `Export ${flaggedCount} flagged` : "Export flagged"}
        </button>
      </header>

      {loading ? (
        <div className="loading big">
          <span className="spin-sm" /> Reading folder…
        </div>
      ) : visible.length === 0 ? (
        <div className="empty big">
          <Picture size={42} />
          <p>
            {files.length === 0
              ? "No photos in this folder."
              : "Nothing matches the current filter."}
          </p>
          {files.length > 0 && (
            <span className="muted">
              {flaggedOnly
                ? "No flagged photos here yet."
                : "Try adjusting the filter."}
            </span>
          )}
        </div>
      ) : (
        <div className={"thumb-grid d-" + density} ref={gridRef}>
          {visible.map((f, i) => {
            const on = flags.has(f.path);
            if (!f.image) {
              return (
                <div
                  key={f.path}
                  className={"tile file" + (i === sel ? " sel" : "")}
                  onClick={() => setSel(i)}
                >
                  <div className="tile-img file-tile">
                    <FileIcon size={28} />
                    <span className="file-ext">
                      {(f.name.split(".").pop() || "file").toUpperCase()}
                    </span>
                  </div>
                  <div className="tile-name" title={f.name}>
                    {f.name}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={f.path}
                className={
                  "tile" + (i === sel ? " sel" : "") + (on ? " flagged" : "")
                }
                onClick={() => setSel(i)}
                onContextMenu={(e) => onImageContext(e, f.path)}
              >
                <div className="tile-img">
                  <img
                    src={imageUrl(f.path, THUMB)}
                    loading="lazy"
                    alt={f.name}
                    draggable={false}
                    onClick={() => openImage(f)}
                  />
                  <div className="tile-scrim" />
                  {f.raw && <span className="raw-badge">RAW</span>}
                  <button
                    className={"flag-btn" + (on ? " on" : "")}
                    title={on ? "Unflag" : "Flag for export"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(f.path);
                    }}
                  >
                    {on ? <FlagFill size={15} /> : <Flag size={15} />}
                  </button>
                </div>
                <div className="tile-name" title={f.name}>
                  {f.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
