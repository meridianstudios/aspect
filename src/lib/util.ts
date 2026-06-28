export function pathSep(path: string): string {
  return path.includes("\\") ? "\\" : "/";
}

export function baseName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || path;
}

/** Progressive breadcrumb segments for a path. */
export function crumbs(path: string): { name: string; path: string }[] {
  const isWin = path.includes("\\") || /^[A-Za-z]:/.test(path);
  const sep = isWin ? "\\" : "/";
  const parts = path.split(/[\\/]/);
  const out: { name: string; path: string }[] = [];
  let acc = "";

  parts.forEach((part, i) => {
    if (part === "") {
      if (i === 0 && !isWin) {
        acc = "/";
        out.push({ name: "/", path: "/" });
      }
      return;
    }
    if (isWin && i === 0 && /^[A-Za-z]:$/.test(part)) {
      acc = part + "\\";
      out.push({ name: part, path: acc });
      return;
    }
    acc = acc && !acc.endsWith(sep) ? acc + sep + part : acc + part;
    out.push({ name: part, path: acc });
  });

  return out;
}

export function fmtSize(bytes: number): string {
  if (!bytes) return "";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`;
}

export function fmtDate(ms: number): string {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
