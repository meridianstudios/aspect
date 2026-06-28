import { useCallback, useEffect, useRef, useState } from "react";
import { imageInfo, imageUrl } from "../lib/api";
import type { ImageEntry, ImageInfo } from "../types";
import {
  Flag,
  FlagFill,
  ChevronLeft,
  ChevronRight,
  Close,
  Info,
} from "../lib/icons";
import { fmtSize } from "../lib/util";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="info-k">{label}</span>
      <span className="info-v">{value}</span>
    </div>
  );
}

export default function Viewer({
  images,
  start,
  flags,
  onToggleFlag,
  onClose,
}: {
  images: ImageEntry[];
  start: number;
  flags: Set<string>;
  onToggleFlag: (p: string) => void;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  const [loaded, setLoaded] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const cur = images[idx];
  const go = useCallback(
    (d: number) =>
      setIdx((i) => {
        const n = i + d;
        return n < 0 ? 0 : n >= images.length ? images.length - 1 : n;
      }),
    [images.length],
  );

  useEffect(() => setLoaded(false), [idx]);

  // preload neighbours for snappy cycling
  useEffect(() => {
    [idx - 1, idx + 1].forEach((n) => {
      if (n >= 0 && n < images.length) {
        const im = new Image();
        im.src = imageUrl(images[n].path);
      }
    });
  }, [idx, images]);

  // fetch metadata when the info panel is open (and on photo change)
  useEffect(() => {
    if (!showInfo || !cur) return;
    let alive = true;
    setInfoLoading(true);
    imageInfo(cur.path)
      .then((d) => alive && (setInfo(d), setInfoLoading(false)))
      .catch(() => alive && (setInfo(null), setInfoLoading(false)));
    return () => {
      alive = false;
    };
  }, [showInfo, cur?.path]);

  const FS_WINDOW = 30;
  const fsLo = Math.max(0, idx - FS_WINDOW);
  const fsHi = Math.min(images.length, idx + FS_WINDOW + 1);
  const fsSlice = images.slice(fsLo, fsHi);

  useEffect(() => {
    const el = stripRef.current?.children[idx - fsLo] as HTMLElement | undefined;
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [idx, fsLo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        go(1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        go(-1);
        e.preventDefault();
      } else if (e.key === "Escape") {
        if (showInfo) setShowInfo(false);
        else onClose();
      } else if (e.key === "f" || e.key === "F") {
        if (cur) onToggleFlag(cur.path);
      } else if (e.key === "i" || e.key === "I") {
        setShowInfo((s) => !s);
      } else if (e.key === "Home") {
        setIdx(0);
      } else if (e.key === "End") {
        setIdx(images.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, cur, onToggleFlag, images.length, showInfo]);

  // auto-hide the chrome after a moment of no mouse movement
  useEffect(() => {
    let t = 0;
    const show = () => {
      setChrome(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setChrome(false), 2400);
    };
    show();
    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      window.clearTimeout(t);
    };
  }, [idx]);

  if (!cur) return null;
  const on = flags.has(cur.path);
  const hasCamera =
    info &&
    (info.taken ||
      info.camera ||
      info.lens ||
      info.focal ||
      info.aperture ||
      info.shutter ||
      info.iso ||
      info.gps);

  return (
    <div
      className={
        "viewer" + (chrome ? " show-chrome" : "") + (showInfo ? " with-info" : "")
      }
      onClick={onClose}
    >
      <div className="viewer-stage" onClick={(e) => e.stopPropagation()}>
        {!loaded && <div className="viewer-spin" />}
        <img
          className="viewer-img"
          src={imageUrl(cur.path)}
          alt={cur.name}
          draggable={false}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="viewer-top" onClick={(e) => e.stopPropagation()}>
        <span className="vt-name">
          {cur.name}
          {cur.raw && <span className="vt-raw">RAW</span>}
        </span>
        <span className="vt-idx">
          {idx + 1} / {images.length}
        </span>
        <div className="spacer" />
        <button
          className={"vt-icon" + (showInfo ? " on" : "")}
          title="Info (I)"
          onClick={() => setShowInfo((s) => !s)}
        >
          <Info size={18} />
        </button>
        <button
          className={"vt-flag" + (on ? " on" : "")}
          title="Flag (F)"
          onClick={() => onToggleFlag(cur.path)}
        >
          {on ? <FlagFill size={18} /> : <Flag size={18} />}
          <span>{on ? "Flagged" : "Flag"}</span>
        </button>
        <button className="vt-icon" title="Close (Esc)" onClick={onClose}>
          <Close size={20} />
        </button>
      </div>

      <button
        className="viewer-nav left"
        disabled={idx === 0}
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
      >
        <ChevronLeft size={30} />
      </button>
      <button
        className="viewer-nav right"
        disabled={idx === images.length - 1}
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
      >
        <ChevronRight size={30} />
      </button>

      {showInfo && (
        <div className="viewer-info" onClick={(e) => e.stopPropagation()}>
          <div className="info-head">
            <span>Info</span>
            <button className="iconbtn" onClick={() => setShowInfo(false)}>
              <Close size={16} />
            </button>
          </div>
          {infoLoading && !info ? (
            <div className="info-loading">
              <span className="spin-sm" />
            </div>
          ) : info ? (
            <div className="info-body">
              <div className="info-sec">File</div>
              <Row label="Name" value={info.name} />
              <Row label="Format" value={info.format} />
              <Row
                label="Dimensions"
                value={
                  info.width && info.height
                    ? `${info.width} × ${info.height}`
                    : null
                }
              />
              <Row label="Size" value={fmtSize(info.size)} />
              <Row
                label="Modified"
                value={
                  info.modified
                    ? new Date(info.modified).toLocaleString()
                    : null
                }
              />
              {hasCamera && <div className="info-sec">Camera</div>}
              <Row label="Taken" value={info.taken} />
              <Row label="Camera" value={info.camera} />
              <Row label="Lens" value={info.lens} />
              <Row label="Focal length" value={info.focal} />
              <Row label="Aperture" value={info.aperture} />
              <Row label="Shutter" value={info.shutter} />
              <Row label="ISO" value={info.iso} />
              <Row label="GPS" value={info.gps} />
            </div>
          ) : (
            <div className="info-body">
              <p className="muted">No details available.</p>
            </div>
          )}
        </div>
      )}

      <div className="filmstrip" onClick={(e) => e.stopPropagation()}>
        <div className="fs-track" ref={stripRef}>
          {fsSlice.map((im, j) => {
            const i = fsLo + j;
            return (
              <button
                key={im.path}
                className={
                  "fs-thumb" +
                  (i === idx ? " on" : "") +
                  (flags.has(im.path) ? " flagged" : "")
                }
                title={im.name}
                onClick={() => setIdx(i)}
              >
                <img
                  src={imageUrl(im.path, 120)}
                  loading="lazy"
                  draggable={false}
                />
                {flags.has(im.path) && (
                  <span className="fs-flag">
                    <FlagFill size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
