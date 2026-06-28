import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { exportFlagged, openFolder } from "../lib/api";
import type { ExportResult, ImageEntry } from "../types";
import { Export, Close, Check } from "../lib/icons";

export default function ExportModal({
  flaggedImages,
  onClose,
}: {
  flaggedImages: ImageEntry[];
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setErr(null);
    const dest = await openDialog({
      directory: true,
      title: "Choose export destination",
    });
    if (typeof dest !== "string") return;
    setBusy(true);
    try {
      setResult(await exportFlagged(flaggedImages.map((i) => i.path), dest));
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
            <Export size={18} /> Export flagged photos
          </h3>
          <button className="iconbtn" onClick={onClose}>
            <Close size={18} />
          </button>
        </div>

        {!result ? (
          <div className="modal-body">
            <p>
              <span className="big-num">{flaggedImages.length}</span> flagged
              photo{flaggedImages.length === 1 ? "" : "s"} ready to copy.
            </p>
            <p className="muted">
              The originals stay where they are. Aspect copies the flagged files
              into a folder you choose.
            </p>
            {err && <div className="error">{err}</div>}
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn primary"
                disabled={busy || flaggedImages.length === 0}
                onClick={run}
              >
                {busy ? "Copying…" : "Choose destination and export"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="result-ok">
              <Check size={30} />
            </div>
            <p>
              <b>{result.copied}</b> photo{result.copied === 1 ? "" : "s"} copied
              {result.failed.length
                ? `, ${result.failed.length} failed`
                : ""}
              .
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
