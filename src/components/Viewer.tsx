import { useCallback, useEffect, useRef, useState } from "react";
import { imageUrl } from "../lib/api";
import type { ImageEntry } from "../types";
import { Flag, FlagFill, ChevronLeft, ChevronRight, Close } from "../lib/icons";

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

  // keep the active filmstrip thumb centred
  useEffect(() => {
    const el = stripRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        go(1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        go(-1);
        e.preventDefault();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "f" || e.key === "F") {
        if (cur) onToggleFlag(cur.path);
      } else if (e.key === "Home") {
        setIdx(0);
      } else if (e.key === "End") {
        setIdx(images.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, cur, onToggleFlag, images.length]);

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

  return (
    <div className={"viewer" + (chrome ? " show-chrome" : "")} onClick={onClose}>
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
          className={"vt-flag" + (on ? " on" : "")}
          title="Flag (F)"
          onClick={() => onToggleFlag(cur.path)}
        >
          {on ? <FlagFill size={18} /> : <Flag size={18} />}
          <span>{on ? "Flagged" : "Flag"}</span>
        </button>
        <button className="vt-close" title="Close (Esc)" onClick={onClose}>
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

      <div className="filmstrip" onClick={(e) => e.stopPropagation()}>
        <div className="fs-track" ref={stripRef}>
          {images.map((im, i) => (
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
              <img src={imageUrl(im.path, 120)} loading="lazy" draggable={false} />
              {flags.has(im.path) && (
                <span className="fs-flag">
                  <FlagFill size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
