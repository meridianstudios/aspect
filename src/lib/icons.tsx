import type { SVGProps } from "react";

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

/** The Aspect mark: a viewfinder frame around a lens. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 4H18a2 2 0 0 1 2 2v2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 15.5V18a2 2 0 0 1-2 2h-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 20H6a2 2 0 0 1-2-2v-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" />
    </svg>
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

export const Grid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.2" />
    <rect x="13" y="4" width="7" height="7" rx="1.2" />
    <rect x="4" y="13" width="7" height="7" rx="1.2" />
    <rect x="13" y="13" width="7" height="7" rx="1.2" />
  </Svg>
);
