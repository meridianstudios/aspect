import { useCallback, useEffect, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listDir, listVolumes } from "../lib/api";
import type { DirListing, Volume } from "../types";
import {
  Logo,
  Home as HomeIcon,
  Drive,
  Card,
  Folder,
  FolderOpen,
  ArrowUp,
  ChevronRight,
  Picture,
} from "../lib/icons";
import { baseName, crumbs, fmtSize } from "../lib/util";

export default function Browser({
  onHome,
  onOpen,
}: {
  onHome: () => void;
  onOpen: (path: string, name: string) => void;
}) {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [path, setPath] = useState<string | null>(null);
  const [listing, setListing] = useState<DirListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listVolumes()
      .then(setVolumes)
      .catch(() => {});
  }, []);

  const navigate = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    setPath(p);
    try {
      setListing(await listDir(p));
    } catch (e) {
      setError(String(e));
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const pickNative = async () => {
    const sel = await openDialog({ directory: true, title: "Choose a folder" });
    if (typeof sel === "string") navigate(sel);
  };

  const quick = volumes.filter((v) => v.kind === "quick");
  const drives = volumes.filter((v) => v.kind !== "quick");

  return (
    <div className="view browse">
      <header className="topbar">
        <div className="brand" role="button" onClick={onHome}>
          <span className="brand-mark">
            <Logo size={22} />
          </span>
          <span className="brand-name">Aspect</span>
        </div>
        <button className="btn ghost" onClick={onHome}>
          <HomeIcon size={16} /> Home
        </button>
        <div className="spacer" />
        <button className="btn ghost" onClick={pickNative}>
          System dialog
        </button>
      </header>

      <div className="browse-body">
        <aside className="rail">
          <div className="rail-group">
            <div className="rail-title">Quick access</div>
            {quick.map((v) => (
              <button
                key={v.path}
                className={"rail-item" + (path === v.path ? " on" : "")}
                onClick={() => navigate(v.path)}
              >
                <Folder size={16} />
                <span>{v.name}</span>
              </button>
            ))}
          </div>
          <div className="rail-group">
            <div className="rail-title">Drives and cards</div>
            {drives.map((v) => (
              <button
                key={v.path}
                className={"rail-item" + (path === v.path ? " on" : "")}
                onClick={() => navigate(v.path)}
              >
                {v.kind === "removable" ? <Card size={16} /> : <Drive size={16} />}
                <span className="rail-vol">
                  <span className="rail-vol-name">{v.name}</span>
                  {v.total > 0 && (
                    <span className="rail-vol-sub">{fmtSize(v.free)} free</span>
                  )}
                </span>
              </button>
            ))}
            {volumes.length === 0 && (
              <div className="rail-empty muted">
                Drives appear when running the app.
              </div>
            )}
          </div>
        </aside>

        <main className="browse-main">
          {path === null ? (
            <div className="browse-hint">
              <Picture size={40} />
              <h2>Pick a drive or folder</h2>
              <p className="muted">
                Choose a location on the left to explore its folders. Memory
                cards show up under Drives and cards.
              </p>
            </div>
          ) : (
            <>
              <div className="crumbbar">
                <button
                  className="iconbtn"
                  disabled={!listing?.parent}
                  title="Up one level"
                  onClick={() => listing?.parent && navigate(listing.parent)}
                >
                  <ArrowUp size={18} />
                </button>
                <div className="crumbs">
                  {crumbs(path).map((c, i, a) => (
                    <span key={c.path} className="crumb-seg">
                      <button className="crumb" onClick={() => navigate(c.path)}>
                        {c.name}
                      </button>
                      {i < a.length - 1 && (
                        <span className="crumb-sep">
                          <ChevronRight size={14} />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {listing && listing.image_count > 0 && (
                <button
                  className="open-banner"
                  onClick={() => onOpen(path, baseName(path))}
                >
                  <span className="ob-ico">
                    <FolderOpen size={22} />
                  </span>
                  <span className="ob-text">
                    <b>
                      Open {listing.image_count} photo
                      {listing.image_count === 1 ? "" : "s"}
                    </b>
                    <span className="muted">in {baseName(path)}</span>
                  </span>
                  <span className="ob-go">
                    View <ChevronRight size={16} />
                  </span>
                </button>
              )}

              {loading ? (
                <div className="loading">Loading…</div>
              ) : error ? (
                <div className="error">Could not open this folder. {error}</div>
              ) : (
                listing && (
                  <div className="folder-list">
                    {listing.folders.length === 0 &&
                      listing.image_count === 0 && (
                        <div className="muted pad">This folder is empty.</div>
                      )}
                    {listing.folders.length === 0 &&
                      listing.image_count > 0 && (
                        <div className="muted pad">
                          No subfolders. Use the button above to view the photos
                          here.
                        </div>
                      )}
                    {listing.folders.map((f) => (
                      <button
                        key={f.path}
                        className="folder-row"
                        onClick={() => navigate(f.path)}
                      >
                        <Folder size={18} />
                        <span className="folder-row-name">{f.name}</span>
                        <span className="folder-row-go">
                          <ChevronRight size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
