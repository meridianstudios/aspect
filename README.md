# Aspect

A fast photo culling app for Windows and macOS, by Meridian Development Studios.

Aspect is built for the part of photography nobody enjoys: sitting down with a full memory card and picking out the keepers. Point it at a folder or a card, scroll the grid, open anything full screen, flag the shots you want, and export just those to a new folder. Your originals never move.

## What it does

- Browse local drives and removable cards from inside the app, no digging through system dialogs
- Grid view of every photo in a folder, with quick thumbnails
- Full screen viewer with arrow key navigation and no app chrome in the way
- Flag photos from the grid or the viewer, with a click or the F key
- Export every flagged photo into a folder you choose. It copies the files, it never moves or deletes the originals
- Reads RAW files (CR2, CR3, NEF, ARW, DNG and others) by pulling out the embedded full size JPEG preview, so you can cull RAW quickly without a heavy decode

## Keyboard

- Arrow keys: move through the grid
- Enter: open the selected photo
- F: flag or unflag
- Left and right arrows, or space: previous and next in the viewer
- Esc: close the viewer

## Tech

Tauri 2 with a React and TypeScript front end. A small Rust backend handles the file system, drive listing, thumbnailing and RAW preview extraction, and serves images to the window over a custom `aspect://` protocol so the originals stay where they are.

## Development

```
npm install
npm run dev         # front end only, in a browser (file features need the desktop app)
npm run tauri dev   # the real desktop app
```

## Build

```
npm run tauri build
```

A Meridian project.
