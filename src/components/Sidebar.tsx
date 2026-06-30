import { useEffect, useState } from "react";
import { listVolumes } from "../lib/api";
import type { Volume } from "../types";
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
} from "../lib/icons";

const QUICK_ORDER = ["Pictures", "Downloads", "Desktop", "Home"];

export default function Sidebar({
  view,
  onHome,
  onBrowse,
  onConvert,
  onExplore,
  flagCount,
  onExportAll,
}: {
  view: string;
  onHome: () => void;
  onBrowse: () => void;
  onConvert: () => void;
  onExplore: (path: string) => void;
  flagCount: number;
  onExportAll: () => void;
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
        <div className="side-flag">
          <FlagFill size={14} /> {flagCount} flagged
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
