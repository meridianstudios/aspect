import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { convertImages, imageUrl, openFolder } from "../lib/api";
import type { ConvertResult } from "../types";
import {
  Logo,
  ChevronLeft,
  Convert as ConvertIcon,
  Close,
  Check,
} from "../lib/icons";
import { baseName } from "../lib/util";

const FORMATS: [string, string][] = [
  ["png", "PNG"],
  ["jpeg", "JPEG"],
  ["webp", "WebP"],
  ["bmp", "BMP"],
  ["tiff", "TIFF"],
];

const IMG_EXTS = [
  "jpg", "jpeg", "jfif", "png", "gif", "bmp", "webp", "tif", "tiff", "avif",
  "ico", "cr2", "cr3", "nef", "nrw", "arw", "sr2", "srf", "dng", "raf", "orf",
  "rw2", "pef", "srw", "dcr", "kdc", "mrw", "x3f", "3fr", "erf", "iiq", "raw",
  "rwl",
];

export default function Convert({ onHome }: { onHome: () => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const addFiles = async () => {
    const sel = await openDialog({
      multiple: true,
      title: "Choose images to convert",
      filters: [{ name: "Images", extensions: IMG_EXTS }],
    });
    if (!sel) return;
    const arr = Array.isArray(sel) ? sel : [sel];
    setFiles((prev) => Array.from(new Set([...prev, ...arr])));
    setResult(null);
  };

  const run = async () => {
    if (files.length === 0) return;
    const dest = await openDialog({
      directory: true,
      title: "Choose output folder",
    });
    if (typeof dest !== "string") return;
    setErr(null);
    setResult(null);
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const un = await listen<{ done: number; total: number }>(
      "convert-progress",
      (e) => setProgress(e.payload),
    );
    try {
      setResult(
        await convertImages(files, format, format === "jpeg" ? quality : 90, dest),
      );
    } catch (e) {
      setErr(String(e));
    } finally {
      un();
      setBusy(false);
    }
  };

  return (
    <div className="view convert">
      <header className="topbar">
        <div className="brand" role="button" onClick={onHome}>
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <button className="iconbtn" title="Home" onClick={onHome}>
          <ChevronLeft size={18} />
        </button>
        <div className="grid-title">
          <ConvertIcon size={16} />
          <span className="gt-name">Convert</span>
        </div>
        <div className="spacer" />
        {files.length > 0 && (
          <button
            className="btn ghost"
            onClick={() => {
              setFiles([]);
              setResult(null);
            }}
          >
            Clear
          </button>
        )}
        <button className="btn ghost" onClick={addFiles}>
          Add images
        </button>
      </header>

      <div className="convert-body">
        <div className="convert-main">
          {files.length === 0 ? (
            <button className="convert-drop" onClick={addFiles}>
              <ConvertIcon size={40} />
              <h2>Convert image files</h2>
              <p className="muted">
                Pick images and turn them into PNG, JPEG, WebP, BMP or TIFF.
                Your originals stay where they are.
              </p>
              <span className="btn primary">Add images</span>
            </button>
          ) : (
            <div className="convert-grid">
              {files.map((p) => (
                <div className="conv-tile" key={p}>
                  <div className="conv-thumb">
                    <img
                      src={imageUrl(p, 240)}
                      loading="lazy"
                      alt={baseName(p)}
                      draggable={false}
                    />
                    <button
                      className="conv-x"
                      title="Remove"
                      onClick={() =>
                        setFiles((prev) => prev.filter((x) => x !== p))
                      }
                    >
                      <Close size={14} />
                    </button>
                  </div>
                  <div className="conv-name" title={p}>
                    {baseName(p)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="convert-side">
          <div className="cs-sec">
            <div className="cs-label">Convert to</div>
            <div className="seg wide">
              {FORMATS.map(([v, l]) => (
                <button
                  key={v}
                  className={"seg-btn" + (format === v ? " on" : "")}
                  onClick={() => setFormat(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {format === "jpeg" && (
            <div className="cs-sec">
              <div className="cs-label">
                JPEG quality <span className="cs-val">{quality}</span>
              </div>
              <input
                className="cs-range"
                type="range"
                min={50}
                max={100}
                value={quality}
                onChange={(e) => setQuality(+e.target.value)}
              />
            </div>
          )}

          <div className="cs-count">
            {files.length} image{files.length === 1 ? "" : "s"} selected
          </div>

          {err && <div className="error">{err}</div>}

          {busy ? (
            <div className="cs-progress">
              <div className="conv-bar">
                <div
                  className="conv-fill"
                  style={{
                    width: progress.total
                      ? `${Math.round((progress.done / progress.total) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <span className="muted">
                Converting {progress.done} / {progress.total}…
              </span>
            </div>
          ) : result ? (
            <div className="cs-result">
              <div className="result-ok sm">
                <Check size={22} />
              </div>
              <p>
                <b>{result.converted}</b> converted
                {result.failed.length ? `, ${result.failed.length} failed` : ""}.
              </p>
              {result.failed.length > 0 && (
                <div className="error">{result.failed[0]}</div>
              )}
              <button
                className="btn primary wide"
                onClick={() => openFolder(result.dest)}
              >
                Open folder
              </button>
            </div>
          ) : (
            <button
              className="btn primary wide"
              disabled={files.length === 0}
              onClick={run}
            >
              Convert {files.length || ""}{" "}
              {files.length === 1 ? "image" : "images"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
