// Aspect - photo culling backend.
//
// Responsibilities:
//   * enumerate drives / removable media / quick-access folders (list_volumes)
//   * browse directories and count images (list_dir)
//   * list the images in a folder with metadata (list_images)
//   * copy the flagged images out to a chosen folder (export_flagged)
//   * serve image bytes + on-the-fly thumbnails to the webview via the custom
//     `aspect://` URI scheme, including embedded-JPEG extraction for RAW files.

use std::io::Cursor;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::http::{Request, Response};

// ---------------------------------------------------------------------------
// formats
// ---------------------------------------------------------------------------

// RAW formats: we cannot decode these in the webview, so we pull out the
// embedded full-size JPEG preview that virtually every camera writes.
const RAW_EXTS: &[&str] = &[
    "cr2", "cr3", "crw", "nef", "nrw", "arw", "sr2", "srf", "dng", "raf", "orf", "rw2", "pef",
    "srw", "dcr", "kdc", "mrw", "mos", "x3f", "3fr", "erf", "iiq", "cap", "mef", "raw", "rwl",
];

// Standard formats the webview can display directly.
const STD_EXTS: &[&str] = &[
    "jpg", "jpeg", "jfif", "png", "gif", "bmp", "webp", "tif", "tiff", "avif", "ico",
];

fn ext_lower(p: &Path) -> String {
    p.extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default()
}

fn is_raw(p: &Path) -> bool {
    RAW_EXTS.contains(&ext_lower(p).as_str())
}

fn is_image(p: &Path) -> bool {
    let e = ext_lower(p);
    RAW_EXTS.contains(&e.as_str()) || STD_EXTS.contains(&e.as_str())
}

fn content_type(p: &Path) -> &'static str {
    match ext_lower(p).as_str() {
        "png" => "image/png",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "webp" => "image/webp",
        "tif" | "tiff" => "image/tiff",
        "avif" => "image/avif",
        "ico" => "image/x-icon",
        _ => "image/jpeg",
    }
}

// ---------------------------------------------------------------------------
// data types returned to the frontend
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct Volume {
    name: String,
    path: String,
    kind: String, // "quick" | "drive" | "removable"
    total: u64,
    free: u64,
}

#[derive(Serialize)]
struct FolderEntry {
    name: String,
    path: String,
}

#[derive(Serialize)]
struct DirListing {
    path: String,
    parent: Option<String>,
    folders: Vec<FolderEntry>,
    image_count: usize,
}

#[derive(Serialize)]
struct ImageEntry {
    name: String,
    path: String,
    size: u64,
    modified: u64, // ms since the unix epoch
    raw: bool,
}

#[derive(Serialize)]
struct ExportResult {
    copied: usize,
    failed: Vec<String>,
    dest: String,
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

fn push_quick(out: &mut Vec<Volume>, name: &str, path: PathBuf) {
    if path.is_dir() {
        out.push(Volume {
            name: name.to_string(),
            path: path.to_string_lossy().to_string(),
            kind: "quick".into(),
            total: 0,
            free: 0,
        });
    }
}

#[tauri::command]
fn list_volumes() -> Vec<Volume> {
    let mut out: Vec<Volume> = Vec::new();

    if let Some(p) = dirs::home_dir() {
        push_quick(&mut out, "Home", p);
    }
    if let Some(p) = dirs::desktop_dir() {
        push_quick(&mut out, "Desktop", p);
    }
    if let Some(p) = dirs::picture_dir() {
        push_quick(&mut out, "Pictures", p);
    }
    if let Some(p) = dirs::download_dir() {
        push_quick(&mut out, "Downloads", p);
    }

    let disks = sysinfo::Disks::new_with_refreshed_list();
    for d in disks.list() {
        let mount = d.mount_point().to_string_lossy().to_string();
        let label = d.name().to_string_lossy().to_string();
        let name = if label.trim().is_empty() {
            mount.clone()
        } else {
            format!("{label} ({mount})")
        };
        out.push(Volume {
            name,
            path: mount,
            kind: if d.is_removable() {
                "removable".into()
            } else {
                "drive".into()
            },
            total: d.total_space(),
            free: d.available_space(),
        });
    }

    out
}

#[tauri::command]
fn list_dir(path: String) -> Result<DirListing, String> {
    let p = PathBuf::from(&path);
    let rd = std::fs::read_dir(&p).map_err(|e| e.to_string())?;

    let mut folders: Vec<FolderEntry> = Vec::new();
    let mut image_count = 0usize;

    for entry in rd.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let ft = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        if ft.is_dir() {
            if name.starts_with('.') {
                continue; // hide dot-folders (caches, junk)
            }
            folders.push(FolderEntry {
                name,
                path: entry.path().to_string_lossy().to_string(),
            });
        } else if ft.is_file() && is_image(&entry.path()) {
            image_count += 1;
        }
    }

    folders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    let parent = p.parent().map(|x| x.to_string_lossy().to_string());

    Ok(DirListing {
        path,
        parent,
        folders,
        image_count,
    })
}

#[tauri::command]
fn list_images(path: String) -> Result<Vec<ImageEntry>, String> {
    let p = PathBuf::from(&path);
    let rd = std::fs::read_dir(&p).map_err(|e| e.to_string())?;

    let mut imgs: Vec<ImageEntry> = Vec::new();
    for entry in rd.flatten() {
        let ep = entry.path();
        if !ep.is_file() || !is_image(&ep) {
            continue;
        }
        let meta = entry.metadata().ok();
        let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
        let modified = meta
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        imgs.push(ImageEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: ep.to_string_lossy().to_string(),
            size,
            modified,
            raw: is_raw(&ep),
        });
    }

    imgs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(imgs)
}

// Build a non-colliding target path inside `dest` for the file `src`.
fn unique_target(dest: &Path, src: &Path) -> PathBuf {
    let stem = src
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("image")
        .to_string();
    let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("");
    for n in 1..10_000 {
        let name = if ext.is_empty() {
            format!("{stem} ({n})")
        } else {
            format!("{stem} ({n}).{ext}")
        };
        let cand = dest.join(name);
        if !cand.exists() {
            return cand;
        }
    }
    dest.join(format!("{stem}-copy"))
}

#[tauri::command]
fn export_flagged(paths: Vec<String>, dest: String) -> Result<ExportResult, String> {
    let dest_dir = PathBuf::from(&dest);
    std::fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;

    let mut copied = 0usize;
    let mut failed: Vec<String> = Vec::new();

    for src in &paths {
        let sp = PathBuf::from(src);
        let fname = match sp.file_name() {
            Some(f) => f.to_os_string(),
            None => {
                failed.push(src.clone());
                continue;
            }
        };
        let mut target = dest_dir.join(&fname);
        if target.exists() {
            target = unique_target(&dest_dir, &sp);
        }
        match std::fs::copy(&sp, &target) {
            Ok(_) => copied += 1,
            Err(_) => failed.push(src.clone()),
        }
    }

    Ok(ExportResult {
        copied,
        failed,
        dest,
    })
}

// ---------------------------------------------------------------------------
// image serving (custom `aspect://` protocol)
// ---------------------------------------------------------------------------

// Scan a buffer for the largest complete JPEG (FFD8 ... FFD9). RAW files embed
// one or more JPEG previews; the largest is the full-size preview we want.
fn extract_largest_jpeg(data: &[u8]) -> Option<Vec<u8>> {
    let mut best: Option<(usize, usize)> = None;
    let mut i = 0usize;
    while i + 1 < data.len() {
        if data[i] == 0xFF && data[i + 1] == 0xD8 {
            let start = i;
            let mut j = i + 2;
            let mut end: Option<usize> = None;
            while j + 1 < data.len() {
                if data[j] == 0xFF && data[j + 1] == 0xD9 {
                    end = Some(j + 2);
                    break;
                }
                j += 1;
            }
            match end {
                Some(e) => {
                    let len = e - start;
                    if best.map_or(true, |(_, bl)| len > bl) {
                        best = Some((start, len));
                    }
                    i = e;
                    continue;
                }
                None => break,
            }
        }
        i += 1;
    }
    best.map(|(s, l)| data[s..s + l].to_vec())
}

// Read the displayable bytes for a path: extracted JPEG for RAW, raw bytes
// otherwise. Returns (bytes, content-type).
fn load_image_bytes(p: &Path) -> Option<(Vec<u8>, &'static str)> {
    let data = std::fs::read(p).ok()?;
    if is_raw(p) {
        extract_largest_jpeg(&data).map(|j| (j, "image/jpeg"))
    } else {
        Some((data, content_type(p)))
    }
}

// Read the EXIF orientation tag (1..8) so re-encoded thumbnails are upright.
fn exif_orientation(data: &[u8]) -> u32 {
    let mut c = Cursor::new(data);
    if let Ok(exif) = exif::Reader::new().read_from_container(&mut c) {
        if let Some(f) = exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY) {
            if let Some(v) = f.value.get_uint(0) {
                return v;
            }
        }
    }
    1
}

// Decode `data`, apply EXIF rotation, scale to fit `max` px, encode JPEG.
fn make_thumb(data: &[u8], max: u32) -> Option<Vec<u8>> {
    let img = image::load_from_memory(data).ok()?;
    let img = match exif_orientation(data) {
        3 => img.rotate180(),
        6 => img.rotate90(),
        8 => img.rotate270(),
        _ => img, // 1 (upright) and the rare mirrored cases are left as-is
    };
    let thumb = img.thumbnail(max, max);
    let rgb = thumb.to_rgb8();

    let mut buf = Cursor::new(Vec::new());
    let mut enc = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, 82);
    enc.encode_image(&rgb).ok()?;
    Some(buf.into_inner())
}

fn not_found() -> Response<Vec<u8>> {
    Response::builder()
        .status(404)
        .header("Access-Control-Allow-Origin", "*")
        .body(Vec::new())
        .unwrap()
}

// Handle one `aspect://localhost/img?path=<encoded>&t=<px>` request.
fn handle_image(req: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let query = req.uri().query().unwrap_or("");
    let mut path = String::new();
    let mut thumb: Option<u32> = None;
    for kv in query.split('&') {
        let mut it = kv.splitn(2, '=');
        let key = it.next().unwrap_or("");
        let val = it.next().unwrap_or("");
        match key {
            "path" => {
                path = urlencoding::decode(val)
                    .map(|c| c.into_owned())
                    .unwrap_or_default()
            }
            "t" => thumb = val.parse().ok(),
            _ => {}
        }
    }

    if path.is_empty() {
        return not_found();
    }
    let pbuf = PathBuf::from(&path);

    let (data, ctype) = match load_image_bytes(&pbuf) {
        Some(d) => d,
        None => return not_found(),
    };

    let (bytes, ctype) = match thumb {
        Some(t) => match make_thumb(&data, t) {
            Some(j) => (j, "image/jpeg"),
            None => (data, ctype), // fall back to full bytes if decode fails
        },
        None => (data, ctype),
    };

    Response::builder()
        .status(200)
        .header("Content-Type", ctype)
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "max-age=86400")
        .body(bytes)
        .unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        // Heavy decode work runs off the UI thread via the async responder.
        .register_asynchronous_uri_scheme_protocol("aspect", |_ctx, req, responder| {
            std::thread::spawn(move || {
                responder.respond(handle_image(&req));
            });
        })
        .invoke_handler(tauri::generate_handler![
            list_volumes,
            list_dir,
            list_images,
            export_flagged
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
