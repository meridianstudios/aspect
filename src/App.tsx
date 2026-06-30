import { useCallback, useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Browser from "./components/Browser";
import Grid from "./components/Grid";
import Viewer from "./components/Viewer";
import Convert from "./components/Convert";
import ExportModal from "./components/ExportModal";
import { addRecent, getFlags, writeFlags } from "./lib/store";
import type { ImageEntry } from "./types";

type ViewKind = "home" | "browse" | "grid" | "convert";

export default function App() {
  const [view, setView] = useState<ViewKind>("home");
  const [browsePath, setBrowsePath] = useState<string | null>(null);
  const [folder, setFolder] = useState<{ path: string; name: string } | null>(
    null,
  );
  const [flags, setFlags] = useState<Set<string>>(
    () => new Set(Object.keys(getFlags())),
  );
  const [viewer, setViewer] = useState<{
    images: ImageEntry[];
    index: number;
  } | null>(null);
  const [exportPaths, setExportPaths] = useState<string[] | null>(null);

  const toggleFlag = useCallback((path: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      writeFlags(next);
      return next;
    });
  }, []);

  const clearFlags = useCallback((paths: string[]) => {
    setFlags((prev) => {
      const next = new Set(prev);
      for (const p of paths) next.delete(p);
      writeFlags(next);
      return next;
    });
  }, []);

  const openFolder = useCallback((path: string, name: string) => {
    setFolder({ path, name });
    setView("grid");
  }, []);

  const goExplore = useCallback((path: string) => {
    setBrowsePath(path);
    setView("browse");
  }, []);

  const recordRecent = useCallback(
    (path: string, name: string, count: number) =>
      addRecent({ path, name, openedAt: Date.now(), count }),
    [],
  );

  const openExport = useCallback(
    (images: ImageEntry[]) =>
      setExportPaths(
        images.filter((im) => flags.has(im.path)).map((im) => im.path),
      ),
    [flags],
  );
  const openExportAll = useCallback(
    () => setExportPaths(Array.from(flags)),
    [flags],
  );

  const openViewer = useCallback(
    (images: ImageEntry[], index: number) => setViewer({ images, index }),
    [],
  );

  return (
    <div className="app">
      <div className="app-shell">
        <Sidebar
          view={view}
          onHome={() => setView("home")}
          onBrowse={() => setView("browse")}
          onConvert={() => setView("convert")}
          onExplore={goExplore}
          flagCount={flags.size}
          onExportAll={openExportAll}
        />
        <div className="content">
          {view === "home" && (
            <Home
              onBrowse={() => setView("browse")}
              onExplore={goExplore}
              onOpen={openFolder}
              onConvert={() => setView("convert")}
            />
          )}
          {view === "browse" && (
            <Browser
              path={browsePath}
              onNavigate={setBrowsePath}
              onOpen={openFolder}
              onOpenViewer={openViewer}
            />
          )}
          {view === "grid" && folder && (
            <Grid
              path={folder.path}
              name={folder.name}
              flags={flags}
              onToggleFlag={toggleFlag}
              onBack={() => goExplore(folder.path)}
              onOpenViewer={openViewer}
              onExport={openExport}
              onClearFlags={clearFlags}
              onLoaded={recordRecent}
            />
          )}
          {view === "convert" && <Convert />}
        </div>
      </div>

      {viewer && (
        <Viewer
          images={viewer.images}
          start={viewer.index}
          flags={flags}
          onToggleFlag={toggleFlag}
          onClose={() => setViewer(null)}
        />
      )}
      {exportPaths && (
        <ExportModal paths={exportPaths} onClose={() => setExportPaths(null)} />
      )}
    </div>
  );
}
