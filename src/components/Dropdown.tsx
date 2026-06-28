import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "../lib/icons";

export default function Dropdown({
  label,
  icon,
  active = false,
  align = "left",
  children,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        className={
          "menu-btn" + (active ? " active" : "") + (open ? " open" : "")
        }
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={13} />
      </button>
      {open && <div className={"menu-pop " + align}>{children}</div>}
    </div>
  );
}
