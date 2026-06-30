import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { convertImages, imageUrl, openFolder, isTauri } from "../lib/api";
import type { ConvertResult } from "../types";
import { Convert as ConvertIcon, Close, Check } from "../lib/icons";
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
const isImg = (p: string) => {
  const i = p.lastIndexOf(".");
  return i >= 0 && IMG_EXTS.includes(p.slice(i + 1).toLowerCase());
};

export default function Convert({
  files,
  onChange,
}: {
  files: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
}) {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // OS file drag-and-drop onto the window
  useEffect(() => {
    if (!isTauri) return;
    let un: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent((e) => {
        const p = e.payload as { type: string; paths?: string[] };
        if (p.type === "enter" || p.type === "over") setDragOver(true);
        else if (p.type === "leave") setDragOver(false);
        else if (p.type === "drop") {
          setDragOver(false);
          const imgs = (p.paths || []).filter(isImg);
          if (imgs.length) {
            onChange((prev) => Array.from(new Set([...prev, ...imgs])));
            setResult(null);
          }
        }
      })
      .then((u) => {
        un = u;
      })
      .catch(() => {});
    return () => {
      if (un) un();
    };
  }, [onChange]);

  const addFiles = async () => {
    const sel = await openDialog({
      multiple: true,
      title: "Choose images to convert",
      filters: [{ name: "Images", extensions: IMG_EXTS }],
    });
    if (!sel) return;
    const arr = Array.isArray(sel) ? sel : [sel];
    onChange((prev) => Array.from(new Set([...prev, ...arr])));
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
      <header className="cbar">
        <div className="grid-title">
          <ConvertIcon size={16} />
          <span className="gt-name">Convert</span>
        </div>
        <span className="count-pill">
          {files.length} image{files.length === 1 ? "" : "s"}
        </span>
        <div className="spacer" />
        {files.length > 0 && (
          <button className="btn ghost" onClick={() => onChange([])}>
            Clear
          </button>
        )}
        <button className="btn ghost" onClick={addFiles}>
          Add images
        </button>
      </header>

      <div className="convert-body">
        <div className="convert-main">
          <button
            className={"convert-drop" + (dragOver ? " over" : "")}
            onClick={addFiles}
          >
            <ConvertIcon size={30} />
            <div className="cd-text">
              <b>Add images to convert</b>
              <span className="muted">Click to browse, or drop image files here</span>
            </div>
          </button>

          {files.length > 0 && (
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
                        onChange((prev) => prev.filter((x) => x !== p))
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
