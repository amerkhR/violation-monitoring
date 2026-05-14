import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function strokeProps(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

export function LayoutDashboardNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-layout-dashboard" aria-hidden {...rest}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

export function ShieldAlertNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-shield-alert" aria-hidden {...rest}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function UsersNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-users" aria-hidden {...rest}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

/** Сотрудники (Lucide contact) */
export function ContactNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-contact" aria-hidden {...rest}>
      <path d="M16 2v2" />
      <path d="M8 2v2" />
      <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path d="M17.97 17.5c-1.47-2-3.75-3.5-5.97-3.5-2.22 0-4.5 1.5-5.97 3.5" />
    </svg>
  );
}

export function BookAlertNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-book-alert" aria-hidden {...rest}>
      <path d="M12 13h.01" />
      <path d="M12 6v3" />
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    </svg>
  );
}

export function ClipboardListNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-clipboard-list" aria-hidden {...rest}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

/** Журнал действий (Lucide scroll-text) */
export function ScrollTextNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-scroll-text" aria-hidden {...rest}>
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </svg>
  );
}

export function LogOutNavIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-log-out" aria-hidden {...rest}>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function PanelToggleIcon({ collapsed, size = 22, ...rest }: IconProps & { collapsed: boolean }) {
  return collapsed ? (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-panel-left-open" aria-hidden {...rest}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m14 9 3 3-3 3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" {...strokeProps(size)} className="lucide lucide-panel-left-close" aria-hidden {...rest}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}
