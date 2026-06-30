import type { SVGProps } from "react";
import logoUrl from "../assets/aspectlogo.png";

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** The Aspect mark (the app logo). */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt=""
      aria-hidden
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

export const Home = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
  </Svg>
);

export const Folder = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6.5a2 2 0 0 1 2-2h3.5l2 2.2H19a2 2 0 0 1 2 2V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
  </Svg>
);

export const FolderOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h3.5l2 2.2H19a2 2 0 0 1 2 2v1H6.5L4 18" />
    <path d="M4 18 6 11h16l-2.2 6.8a1.5 1.5 0 0 1-1.4 1.2H5.5A1.6 1.6 0 0 1 4 18z" />
  </Svg>
);

export const Drive = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="16.6" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <path d="M6.5 12h5" />
  </Svg>
);

export const Card = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3h8.2L18 6.8V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M9 3v3M11.5 3v3M14 3v3" />
  </Svg>
);

export const Picture = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.4" />
    <path d="m5 17 4.5-4.2L13 16l2.5-2.3L20 18" />
  </Svg>
);

export const Flag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21V4" />
    <path d="M6 4h11.5l-2.2 3.6L17.5 12H6z" />
  </Svg>
);

export const FlagFill = ({ size = 20, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M6 21V4" />
    <path d="M6 4h11.5l-2.2 3.6L17.5 12H6z" fill="currentColor" />
  </svg>
);

export const Export = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v11" />
    <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
    <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
  </Svg>
);

export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);

export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const ArrowUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Svg>
);

export const Close = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const Reveal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6.5a2 2 0 0 1 2-2h3.5l2 2.2H19a2 2 0 0 1 2 2V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
    <path d="M12 11v5M9.5 13.5 12 11l2.5 2.5" />
  </Svg>
);

export const ChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const Funnel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18l-7 8v5l-4 2v-7z" />
  </Svg>
);

export const Sort = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4v15" />
    <path d="m4 16 3 3 3-3" />
    <path d="M12 6h8M12 11h5M12 16h2" />
  </Svg>
);

export const Convert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9h12" />
    <path d="m13 6 3 3-3 3" />
    <path d="M20 15H8" />
    <path d="m11 12-3 3 3 3" />
  </Svg>
);

export const Info = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Svg>
);

export const FileIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h7l4 4v12.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3z" />
    <path d="M14 3v4h4" />
  </Svg>
);

export const Grid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.2" />
    <rect x="13" y="4" width="7" height="7" rx="1.2" />
    <rect x="4" y="13" width="7" height="7" rx="1.2" />
    <rect x="13" y="13" width="7" height="7" rx="1.2" />
  </Svg>
);
