import { useEffect, useState } from "react";
import { getRecents, removeRecent } from "../lib/store";
import type { Recent } from "../types";
import { Logo, FolderOpen, Picture, Close } from "../lib/icons";
import { fmtDate } from "../lib/util";

export default function Home({
  onBrowse,
  onOpen,
}: {
  onBrowse: () => void;
  onOpen: (path: string, name: string) => void;
}) {
  const [recents, setRecents] = useState<Recent[]>([]);
  useEffect(() => setRecents(getRecents()), []);

  const remove = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecent(path);
    setRecents(getRecents());
  };

  return (
    <div className="view home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <div className="spacer" />
      </header>

      <div className="home-body">
        <div className="hero">
          <div className="hero-glow" />
          <div className="hero-mark">
            <Logo size={132} />
          </div>
          <h1>Cull your shoot, fast.</h1>
          <p className="hero-sub">
            Browse to a drive or memory card, flag your keepers, then export
            them in one pass. Your originals never move.
          </p>
          <button className="btn primary lg glow" onClick={onBrowse}>
            <FolderOpen size={18} /> Find folder and explore
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
                    <FolderOpen size={24} />
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

        <footer className="home-footer">A Meridian project · v0.1.0</footer>
      </div>
    </div>
  );
}
