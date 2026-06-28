import { useCallback, useState } from "react";
import Home from "./components/Home";
import Browser from "./components/Browser";
import Grid from "./components/Grid";
import Viewer from "./components/Viewer";
import ExportModal from "./components/ExportModal";
import { addRecent, getFlags, writeFlags } from "./lib/store";
import type { ImageEntry } from "./types";

type View =
  | { kind: "home" }
  | { kind: "browse" }
  | { kind: "grid"; path: string; name: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [flags, setFlags] = useState<Set<string>>(
    () => new Set(Object.keys(getFlags())),
  );
  const [viewer, setViewer] = useState<{
    images: ImageEntry[];
    index: number;
  } | null>(null);
  const [exportImages, setExportImages] = useState<ImageEntry[] | null>(null);

  const toggleFlag = useCallback((path: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      writeFlags(next);
      return next;
    });
  }, []);

  const openFolder = useCallback((path: string, name: string) => {
    setView({ kind: "grid", path, name });
  }, []);

  const recordRecent = useCallback(
    (path: string, name: string, count: number) => {
      addRecent({ path, name, openedAt: Date.now(), count });
    },
    [],
  );

  const openExport = useCallback(
    (images: ImageEntry[]) => {
      setExportImages(images.filter((im) => flags.has(im.path)));
    },
    [flags],
  );

  return (
    <div className="app">
      {view.kind === "home" && (
        <Home onBrowse={() => setView({ kind: "browse" })} onOpen={openFolder} />
      )}
      {view.kind === "browse" && (
        <Browser
          onHome={() => setView({ kind: "home" })}
          onOpen={openFolder}
          onOpenViewer={(images, index) => setViewer({ images, index })}
        />
      )}
      {view.kind === "grid" && (
        <Grid
          path={view.path}
          name={view.name}
          flags={flags}
          onToggleFlag={toggleFlag}
          onHome={() => setView({ kind: "home" })}
          onBrowse={() => setView({ kind: "browse" })}
          onOpenViewer={(images, index) => setViewer({ images, index })}
          onExport={openExport}
          onLoaded={recordRecent}
        />
      )}

      {viewer && (
        <Viewer
          images={viewer.images}
          start={viewer.index}
          flags={flags}
          onToggleFlag={toggleFlag}
          onClose={() => setViewer(null)}
        />
      )}
      {exportImages && (
        <ExportModal
          flaggedImages={exportImages}
          onClose={() => setExportImages(null)}
        />
      )}
    </div>
  );
}
