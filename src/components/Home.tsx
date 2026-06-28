import { useEffect, useState } from "react";
import { listVolumes } from "../lib/api";
import { getRecents, removeRecent } from "../lib/store";
import type { Recent, Volume } from "../types";
import {
  Logo,
  FolderOpen,
  Folder,
  Card,
  Picture,
  Close,
  Convert,
} from "../lib/icons";
import { fmtDate } from "../lib/util";

const QUICK_ORDER = ["Pictures", "Downloads", "Desktop", "Home"];

export default function Home({
  onBrowse,
  onExplore,
  onOpen,
  onConvert,
}: {
  onBrowse: () => void;
  onExplore: (path: string) => void;
  onOpen: (path: string, name: string) => void;
  onConvert: () => void;
}) {
  const [recents, setRecents] = useState<Recent[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);

  useEffect(() => {
    setRecents(getRecents());
    listVolumes()
      .then(setVolumes)
      .catch(() => {});
  }, []);

  const remove = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecent(path);
    setRecents(getRecents());
  };

  const cards = volumes.filter((v) => v.kind === "removable");
  const quick = volumes
    .filter((v) => v.kind === "quick")
    .sort((a, b) => QUICK_ORDER.indexOf(a.name) - QUICK_ORDER.indexOf(b.name));

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
          <h1>Find your best shots, fast.</h1>
          <p className="hero-sub">
            Browse a drive or memory card, flag your picks, then export them in
            one pass. Your originals never move.
          </p>
          <div className="hero-cta">
            <button className="btn primary lg glow" onClick={onBrowse}>
              <FolderOpen size={18} /> Find folder and explore
            </button>
            <button className="btn lg" onClick={onConvert}>
              <Convert size={18} /> Convert files
            </button>
          </div>

          {(cards.length > 0 || quick.length > 0) && (
            <div className="hero-quick">
              <span className="hero-quick-label">Jump to</span>
              <div className="qa-row">
                {cards.map((v) => (
                  <button
                    key={v.path}
                    className="qa-chip card"
                    onClick={() => onExplore(v.path)}
                    title={v.path}
                  >
                    <Card size={16} />
                    {v.name}
                  </button>
                ))}
                {quick.map((v) => (
                  <button
                    key={v.path}
                    className="qa-chip"
                    onClick={() => onExplore(v.path)}
                    title={v.path}
                  >
                    {v.name === "Pictures" ? (
                      <Picture size={16} />
                    ) : (
                      <Folder size={16} />
                    )}
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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

        <div className="key-hints">
          <span>
            <span className="kbd">Arrows</span> move
          </span>
          <span>
            <span className="kbd">F</span> flag
          </span>
          <span>
            <span className="kbd">Enter</span> open
          </span>
          <span>
            <span className="kbd">Esc</span> close
          </span>
        </div>

        <footer className="home-footer">A Meridian project · v1.1.2</footer>
      </div>
    </div>
  );
}
