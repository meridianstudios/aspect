import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imageUrl, listFiles } from "../lib/api";
import type { ImageEntry } from "../types";
import {
  getDensity,
  setDensity,
  getImagesOnly,
  setImagesOnly,
  type Density,
} from "../lib/store";
import {
  Logo,
  FolderOpen,
  Flag,
  FlagFill,
  Export,
  ChevronLeft,
  Picture,
  FileIcon,
  Check,
} from "../lib/icons";

const THUMB = 360;

export default function Grid({
  path,
  name,
  flags,
  onToggleFlag,
  onHome,
  onBrowse,
  onOpenViewer,
  onExport,
  onLoaded,
}: {
  path: string;
  name: string;
  flags: Set<string>;
  onToggleFlag: (p: string) => void;
  onHome: () => void;
  onBrowse: () => void;
  onOpenViewer: (images: ImageEntry[], index: number) => void;
  onExport: (images: ImageEntry[]) => void;
  onLoaded: (path: string, name: string, count: number) => void;
}) {
  const [files, setFiles] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [imagesOnly, setImagesOnlyState] = useState(getImagesOnly());
  const [density, setDensityState] = useState<Density>(getDensity());
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

  const images = useMemo(() => files.filter((f) => f.image), [files]);
  const visible = useMemo(
    () => (imagesOnly ? images : files),
    [imagesOnly, images, files],
  );
  const otherCount = files.length - images.length;

  useEffect(() => setSel(0), [imagesOnly, path]);

  const toggleImagesOnly = () => {
    const v = !imagesOnly;
    setImagesOnlyState(v);
    setImagesOnly(v);
  };
  const chooseDensity = (d: Density) => {
    setDensityState(d);
    setDensity(d);
  };

  const flaggedCount = useMemo(
    () => images.reduce((n, im) => n + (flags.has(im.path) ? 1 : 0), 0),
    [images, flags],
  );

  const openImage = useCallback(
    (file: ImageEntry) => {
      const idx = images.findIndex((im) => im.path === file.path);
      if (idx >= 0) onOpenViewer(images, idx);
    },
    [images, onOpenViewer],
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, sel, colCount, openImage, onToggleFlag]);

  useEffect(() => {
    const el = gridRef.current?.children[sel] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  return (
    <div className="view grid-view">
      <header className="topbar">
        <div className="brand" role="button" onClick={onHome}>
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <button className="iconbtn" title="Back to folders" onClick={onBrowse}>
          <ChevronLeft size={18} />
        </button>
        <div className="grid-title">
          <FolderOpen size={16} />
          <span className="gt-name" title={path}>
            {name}
          </span>
        </div>
        <span className="count-pill">
          {images.length} photo{images.length === 1 ? "" : "s"}
          {!imagesOnly && otherCount > 0 ? ` · ${otherCount} other` : ""}
        </span>
        <div className="spacer" />

        <label
          className={"check" + (imagesOnly ? " on" : "")}
          title="Show only image files"
        >
          <input
            type="checkbox"
            checked={imagesOnly}
            onChange={toggleImagesOnly}
          />
          <span className="check-box">{imagesOnly && <Check size={13} />}</span>
          Images only
        </label>

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

        <button
          className="btn primary"
          disabled={flaggedCount === 0}
          onClick={() => onExport(images)}
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
          <p>{imagesOnly ? "No photos in this folder." : "This folder is empty."}</p>
          {imagesOnly && files.length > 0 && (
            <span className="muted">
              {files.length} non-image file{files.length === 1 ? "" : "s"}{" "}
              hidden. Turn off "Images only" to see them.
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
