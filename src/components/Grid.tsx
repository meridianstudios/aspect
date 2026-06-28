import { useCallback, useEffect, useRef, useState } from "react";
import { imageUrl, listImages } from "../lib/api";
import type { ImageEntry } from "../types";
import {
  Logo,
  FolderOpen,
  Flag,
  FlagFill,
  Export,
  ChevronLeft,
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
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    listImages(path)
      .then((imgs) => {
        setImages(imgs);
        setLoading(false);
        onLoaded(path, name, imgs.length);
      })
      .catch(() => {
        setImages([]);
        setLoading(false);
      });
  }, [path, name, onLoaded]);

  const colCount = useCallback(() => {
    const g = gridRef.current;
    if (!g) return 1;
    const cols = getComputedStyle(g).gridTemplateColumns.split(" ");
    return Math.max(1, cols.filter((c) => c && c !== "none").length);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (images.length === 0) return;
      const cols = colCount();
      if (e.key === "ArrowRight") {
        setSel((s) => Math.min(images.length - 1, s + 1));
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setSel((s) => Math.max(0, s - 1));
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setSel((s) => Math.min(images.length - 1, s + cols));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setSel((s) => Math.max(0, s - cols));
        e.preventDefault();
      } else if (e.key === "Enter") {
        onOpenViewer(images, sel);
      } else if (e.key === "f" || e.key === "F") {
        const im = images[sel];
        if (im) onToggleFlag(im.path);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images, sel, colCount, onOpenViewer, onToggleFlag]);

  useEffect(() => {
    const el = gridRef.current?.children[sel] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const flaggedCount = images.reduce(
    (n, im) => n + (flags.has(im.path) ? 1 : 0),
    0,
  );

  return (
    <div className="view grid-view">
      <header className="topbar">
        <div className="brand" role="button" onClick={onHome}>
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <button className="btn ghost" onClick={onBrowse}>
          <ChevronLeft size={16} /> Folders
        </button>
        <div className="grid-title">
          <FolderOpen size={16} />
          <span className="gt-name" title={path}>
            {name}
          </span>
          <span className="muted">
            {images.length} photo{images.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="spacer" />
        <span className="flag-count">
          <FlagFill size={15} /> {flaggedCount} flagged
        </span>
        <button
          className="btn primary"
          disabled={flaggedCount === 0}
          onClick={() => onExport(images)}
        >
          <Export size={16} /> Export flagged
        </button>
      </header>

      {loading ? (
        <div className="loading big">Reading folder…</div>
      ) : images.length === 0 ? (
        <div className="empty big">
          <FolderOpen size={40} />
          <p>No photos in this folder.</p>
        </div>
      ) : (
        <div className="thumb-grid" ref={gridRef}>
          {images.map((im, i) => {
            const on = flags.has(im.path);
            return (
              <div
                key={im.path}
                className={
                  "tile" + (i === sel ? " sel" : "") + (on ? " flagged" : "")
                }
                onClick={() => setSel(i)}
              >
                <div className="tile-img">
                  <img
                    src={imageUrl(im.path, THUMB)}
                    loading="lazy"
                    alt={im.name}
                    draggable={false}
                    onClick={() => onOpenViewer(images, i)}
                  />
                  {im.raw && <span className="raw-badge">RAW</span>}
                  <button
                    className={"flag-btn" + (on ? " on" : "")}
                    title={on ? "Unflag" : "Flag for export"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(im.path);
                    }}
                  >
                    {on ? <FlagFill size={16} /> : <Flag size={16} />}
                  </button>
                </div>
                <div className="tile-name" title={im.name}>
                  {im.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
