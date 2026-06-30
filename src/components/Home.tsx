import { useEffect, useState } from "react";
import { getRecents, removeRecent } from "../lib/store";
import type { Recent } from "../types";
import { FolderOpen, Convert, Picture, Close, ChevronRight } from "../lib/icons";
import { fmtDate } from "../lib/util";

export default function Home({
  onBrowse,
  onOpen,
  onConvert,
}: {
  onBrowse: () => void;
  onExplore: (path: string) => void;
  onOpen: (path: string, name: string) => void;
  onConvert: () => void;
}) {
  const [recents, setRecents] = useState<Recent[]>([]);
  useEffect(() => setRecents(getRecents()), []);

  const remove = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecent(path);
    setRecents(getRecents());
  };

  return (
    <div className="view">
      <header className="cbar">
        <h1 className="cbar-title">Home</h1>
      </header>

      <div className="page">
        <div className="start-cards">
          <button className="start-card" onClick={onBrowse}>
            <span className="start-ico">
              <FolderOpen size={24} />
            </span>
            <span className="start-text">
              <b>Browse photos</b>
              <span className="muted">
                Open a drive, folder or memory card and start culling.
              </span>
            </span>
            <ChevronRight size={18} className="start-go" />
          </button>
          <button className="start-card" onClick={onConvert}>
            <span className="start-ico alt">
              <Convert size={24} />
            </span>
            <span className="start-text">
              <b>Convert files</b>
              <span className="muted">
                Turn images into PNG, JPEG, WebP, BMP or TIFF.
              </span>
            </span>
            <ChevronRight size={18} className="start-go" />
          </button>
        </div>

        <section className="recents">
          <div className="section-head">
            <h2>Recent folders</h2>
          </div>
          {recents.length === 0 ? (
            <div className="empty">
              <Picture size={34} />
              <p>No recent folders yet.</p>
              <span className="muted">Folders you open will show up here.</span>
            </div>
          ) : (
            <div className="recent-grid">
              {recents.map((r) => (
                <button
                  key={r.path}
                  className="recent-card"
                  onClick={() => onOpen(r.path, r.name)}
                  title={r.path}
                >
                  <span
                    className="recent-x"
                    onClick={(e) => remove(e, r.path)}
                    title="Remove from recents"
                  >
                    <Close size={14} />
                  </span>
                  <span className="recent-ico">
                    <FolderOpen size={22} />
                  </span>
                  <span className="recent-name">{r.name}</span>
                  <span className="recent-path">{r.path}</span>
                  <span className="recent-meta">
                    {r.count} photos
                    {r.openedAt ? ` · ${fmtDate(r.openedAt)}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
