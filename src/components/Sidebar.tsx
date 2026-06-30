import { useEffect, useState } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { listVolumes } from "../lib/api";
import type { Volume } from "../types";
import type { Pinned } from "../lib/store";
import {
  Logo,
  Home as HomeIcon,
  FolderOpen,
  Convert,
  Folder,
  Picture,
  Drive,
  Card,
  FlagFill,
  Export,
  Close,
} from "../lib/icons";

const QUICK_ORDER = ["Pictures", "Downloads", "Desktop", "Home"];

export default function Sidebar({
  view,
  pinned,
  onHome,
  onBrowse,
  onConvert,
  onExplore,
  onUnpin,
  flagCount,
  onExportAll,
  onClearAllFlags,
}: {
  view: string;
  pinned: Pinned[];
  onHome: () => void;
  onBrowse: () => void;
  onConvert: () => void;
  onExplore: (path: string) => void;
  onUnpin: (path: string) => void;
  flagCount: number;
  onExportAll: () => void;
  onClearAllFlags: () => void;
}) {
  const [volumes, setVolumes] = useState<Volume[]>([]);

  useEffect(() => {
    listVolumes()
      .then(setVolumes)
      .catch(() => {});
  }, []);

  const quick = volumes
    .filter((v) => v.kind === "quick")
    .sort((a, b) => QUICK_ORDER.indexOf(a.name) - QUICK_ORDER.indexOf(b.name));
  const drives = volumes.filter((v) => v.kind !== "quick");

  const clearAll = async () => {
    if (flagCount === 0) return;
    const ok = await confirm(
      "This unflags every photo in every folder. It can't be undone.",
      { title: "Clear all flags", kind: "warning" },
    );
    if (ok) onClearAllFlags();
  };

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <Logo size={26} />
        <span>Aspect</span>
      </div>

      <nav className="side-nav">
        <button
          className={"side-item" + (view === "home" ? " on" : "")}
          onClick={onHome}
        >
          <HomeIcon size={18} />
          <span>Home</span>
        </button>
        <button
          className={
            "side-item" + (view === "browse" || view === "grid" ? " on" : "")
          }
          onClick={onBrowse}
        >
          <FolderOpen size={18} />
          <span>Browse</span>
        </button>
        <button
          className={"side-item" + (view === "convert" ? " on" : "")}
          onClick={onConvert}
        >
          <Convert size={18} />
          <span>Convert</span>
        </button>
      </nav>

      <div className="side-scroll">
        {pinned.length > 0 && (
          <div className="side-group">
            <div className="side-label">Pinned</div>
            {pinned.map((p) => (
              <div key={p.path} className="side-pin">
                <button
                  className="side-pin-main"
                  onClick={() => onExplore(p.path)}
                  title={p.path}
                >
                  <Folder size={16} />
                  <span className="side-sub-name">{p.name}</span>
                </button>
                <button
                  className="side-unpin"
                  title="Unpin"
                  onClick={() => onUnpin(p.path)}
                >
                  <Close size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        {quick.length > 0 && (
          <div className="side-group">
            <div className="side-label">Quick access</div>
            {quick.map((v) => (
              <button
                key={v.path}
                className="side-sub"
                onClick={() => onExplore(v.path)}
                title={v.path}
              >
                {v.name === "Pictures" ? (
                  <Picture size={16} />
                ) : (
                  <Folder size={16} />
                )}
                <span className="side-sub-name">{v.name}</span>
              </button>
            ))}
          </div>
        )}
        {drives.length > 0 && (
          <div className="side-group">
            <div className="side-label">Drives and cards</div>
            {drives.map((v) => (
              <button
                key={v.path}
                className="side-sub"
                onClick={() => onExplore(v.path)}
                title={v.path}
              >
                {v.kind === "removable" ? <Card size={16} /> : <Drive size={16} />}
                <span className="side-sub-name">{v.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="side-foot">
        <div className="side-flag-row">
          <span className="side-flag">
            <FlagFill size={14} /> {flagCount} flagged in all folders
          </span>
          {flagCount > 0 && (
            <button className="side-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
        <button
          className="btn primary sm wide"
          disabled={flagCount === 0}
          onClick={onExportAll}
        >
          <Export size={15} /> Export flagged
        </button>
        <div className="side-ver">Aspect v{__APP_VERSION__} · Meridian</div>
      </div>
    </aside>
  );
}
