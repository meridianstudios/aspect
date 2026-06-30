import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { convertImages, exportFlagged, openFolder } from "../lib/api";
import { Export, Close, Check, Folder } from "../lib/icons";
import { baseName } from "../lib/util";

const FORMATS: [string, string][] = [
  ["original", "Original"],
  ["png", "PNG"],
  ["jpeg", "JPEG"],
  ["webp", "WebP"],
  ["bmp", "BMP"],
  ["tiff", "TIFF"],
];

export default function ExportModal({
  paths,
  onClose,
}: {
  paths: string[];
  onClose: () => void;
}) {
  const [format, setFormat] = useState("original");
  const [quality, setQuality] = useState(90);
  const [dir, setDir] = useState<string | null>(null);
  const [subfolder, setSubfolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    failed: string[];
    dest: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const chooseDir = async () => {
    const d = await openDialog({ directory: true, title: "Choose a destination" });
    if (typeof d === "string") setDir(d);
  };

  const run = async () => {
    if (!dir) return;
    const sep = dir.includes("\\") ? "\\" : "/";
    const sub = subfolder.trim().replace(/[\\/]+$/, "");
    const dest = sub ? dir + sep + sub : dir;
    setErr(null);
    setBusy(true);
    try {
      if (format === "original") {
        const r = await exportFlagged(paths, dest);
        setResult({ count: r.copied, failed: r.failed, dest: r.dest });
      } else {
        const r = await convertImages(
          paths,
          format,
          format === "jpeg" ? quality : 90,
          dest,
        );
        setResult({ count: r.converted, failed: r.failed, dest: r.dest });
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Export size={18} /> Export {paths.length} flagged photo
            {paths.length === 1 ? "" : "s"}
          </h3>
          <button className="iconbtn" onClick={onClose}>
            <Close size={18} />
          </button>
        </div>

        {!result ? (
          <div className="modal-body">
            <div className="ex-row">
              <div className="ex-label">Format</div>
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
              <p className="ex-hint muted">
                {format === "original"
                  ? "Copies the flagged files as-is. Originals stay put."
                  : `Converts the flagged photos to ${format.toUpperCase()} as it exports.`}
              </p>
            </div>

            {format === "jpeg" && (
              <div className="ex-row">
                <div className="ex-label">
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

            <div className="ex-row">
              <div className="ex-label">Destination</div>
              <button className="dest-pick" onClick={chooseDir}>
                <Folder size={16} />
                <span className="dest-path">
                  {dir ? baseName(dir) : "Choose a folder…"}
                </span>
              </button>
              {dir && <p className="ex-hint muted path-line">{dir}</p>}
            </div>

            <div className="ex-row">
              <div className="ex-label">New subfolder (optional)</div>
              <input
                className="ex-input"
                type="text"
                placeholder="e.g. Selects"
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
              />
              <p className="ex-hint muted">
                Aspect creates it inside the destination if it doesn't exist.
              </p>
            </div>

            {err && <div className="error">{err}</div>}
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn primary"
                disabled={busy || !dir || paths.length === 0}
                onClick={run}
              >
                {busy
                  ? "Working…"
                  : format === "original"
                    ? "Export"
                    : "Export and convert"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="result-ok">
              <Check size={30} />
            </div>
            <p>
              <b>{result.count}</b> photo{result.count === 1 ? "" : "s"}{" "}
              {format === "original" ? "exported" : `converted to ${format.toUpperCase()}`}
              {result.failed.length ? `, ${result.failed.length} failed` : ""}.
            </p>
            <p className="muted path-line">{result.dest}</p>
            {result.failed.length > 0 && (
              <div className="error">{result.failed[0]}</div>
            )}
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>
                Done
              </button>
              <button
                className="btn primary"
                onClick={() => openFolder(result.dest)}
              >
                Open folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
