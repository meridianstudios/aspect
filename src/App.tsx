import { useCallback, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Browser from "./components/Browser";
import Grid from "./components/Grid";
import Viewer from "./components/Viewer";
import Convert from "./components/Convert";
import ExportModal from "./components/ExportModal";
import ContextMenu, { type MenuItem } from "./components/ContextMenu";
import { convertImages } from "./lib/api";
import {
  addRecent,
  getFlags,
  writeFlags,
  getPinned,
  writePinned,
  type Pinned,
} from "./lib/store";
import { baseName } from "./lib/util";
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
  const [pinned, setPinned] = useState<Pinned[]>(() => getPinned());
  const [convertQueue, setConvertQueue] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{
    images: ImageEntry[];
    index: number;
  } | null>(null);
  const [exportPaths, setExportPaths] = useState<string[] | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

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

  const clearAllFlags = useCallback(() => {
    const empty = new Set<string>();
    writeFlags(empty);
    setFlags(empty);
  }, []);

  const togglePin = useCallback((path: string, name: string) => {
    setPinned((prev) => {
      const next = prev.some((p) => p.path === path)
        ? prev.filter((p) => p.path !== path)
        : [...prev, { path, name }];
      writePinned(next);
      return next;
    });
  }, []);

  const unpin = useCallback((path: string) => {
    setPinned((prev) => {
      const next = prev.filter((p) => p.path !== path);
      writePinned(next);
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

  const addToConvert = useCallback(
    (paths: string[]) => {
      setConvertQueue((prev) => Array.from(new Set([...prev, ...paths])));
      showToast(`Added ${paths.length} to Convert`);
    },
    [showToast],
  );

  const convertInPlace = useCallback(
    async (p: string, fmt: string) => {
      const cut = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
      const dir = cut > 0 ? p.slice(0, cut) : p;
      try {
        const r = await convertImages([p], fmt, 90, dir);
        showToast(
          r.converted
            ? `Saved a ${fmt.toUpperCase()} next to the original`
            : "Could not convert that file",
        );
      } catch {
        showToast("Convert failed");
      }
    },
    [showToast],
  );

  const onImageContext = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      const fmts: [string, string][] = [
        ["png", "PNG"],
        ["jpeg", "JPEG"],
        ["webp", "WebP"],
      ];
      const items: MenuItem[] = [
        {
          label: "Add to Convert",
          onClick: () => {
            addToConvert([path]);
            setView("convert");
          },
        },
        ...fmts.map(([f, l], i) => ({
          label: `Convert to ${l} (here)`,
          dividerBefore: i === 0,
          onClick: () => convertInPlace(path, f),
        })),
      ];
      const x = Math.min(e.clientX, window.innerWidth - 230);
      const y = Math.min(e.clientY, window.innerHeight - (items.length * 38 + 16));
      setMenu({ x, y, items });
    },
    [addToConvert, convertInPlace],
  );

  return (
    <div className="app">
      <div className="app-shell">
        <Sidebar
          view={view}
          pinned={pinned}
          onHome={() => setView("home")}
          onBrowse={() => setView("browse")}
          onConvert={() => setView("convert")}
          onExplore={goExplore}
          onUnpin={unpin}
          flagCount={flags.size}
          onExportAll={openExportAll}
          onClearAllFlags={clearAllFlags}
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
              isPinned={
                browsePath !== null && pinned.some((p) => p.path === browsePath)
              }
              onNavigate={setBrowsePath}
              onTogglePin={() =>
                browsePath !== null &&
                togglePin(browsePath, baseName(browsePath))
              }
              onOpen={openFolder}
              onOpenViewer={openViewer}
              onImageContext={onImageContext}
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
              onImageContext={onImageContext}
              onLoaded={recordRecent}
            />
          )}
          {view === "convert" && (
            <Convert files={convertQueue} onChange={setConvertQueue} />
          )}
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
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
