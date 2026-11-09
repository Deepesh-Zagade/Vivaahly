import type { ReactNode, SVGProps } from "react";

export type UiIconName =
  | "account-off"
  | "admin"
  | "arrow-left"
  | "arrow-right"
  | "badge"
  | "calendar"
  | "calendar-check"
  | "check-circle"
  | "clock"
  | "close"
  | "cloud-off"
  | "dashboard"
  | "eye"
  | "eye-off"
  | "heart"
  | "info"
  | "lock"
  | "log-out"
  | "mail"
  | "mail-lock"
  | "mail-out"
  | "manager"
  | "map-pin"
  | "refresh"
  | "send"
  | "settings"
  | "tune"
  | "unavailable"
  | "user-plus"
  | "users"
  | "user-check"
  | "warning"
  | "workspace-off"
  | "link-off"
  | "menu"
  | "plus"
  | "sparkles"
  | "clipboard-check"
  | "wallet"
  | "store"
  | "image"
  | "globe"
  | "video"
  | "edit"
  | "receipt";

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

function paths(name: UiIconName): ReactNode {
  switch (name) {
    case "menu":
      return <><path d="M4 6h16M4 12h16M4 18h16" /></>;
    case "plus":
      return <><path d="M12 4v16M4 12h16" /></>;
    case "sparkles":
      return <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" /></>;
    case "clipboard-check":
      return <><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4V2h6v2M9 13l2 2 4-4" /></>;
    case "wallet":
      return <><path d="M4 6h13a2 2 0 0 1 2 2v2" /><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z" /></>;
    case "store":
      return <><path d="M3 9h18l-2-5H5L3 9Z" /><path d="M5 9v11h14V9M9 20v-6h6v6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>;
    case "image":
      return <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m3 17 5-5 4 4 2-2 7 6" /></>;
    case "globe":
      return <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" /></>;
    case "video":
      return <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3v-4Z" /></>;
    case "edit":
      return <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" /></>;
    case "receipt":
      return <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>;
    case "arrow-left":
      return <><path d="m15 18-6-6 6-6" /><path d="M9 12h11" /></>;
    case "arrow-right":
      return <><path d="m9 18 6-6-6-6" /><path d="M4 12h11" /></>;
    case "users":
      return <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
    case "user-plus":
      return <><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8" cy="7" r="4" /><path d="M19 8v6" /><path d="M16 11h6" /></>;
    case "user-check":
      return <><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>;
    case "calendar-check":
      return <><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="m8 16 2 2 5-5" /></>;
    case "calendar":
      return <><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></>;
    case "mail-out":
      return <><rect x="3" y="5" width="15" height="14" rx="2" /><path d="m3 7 7.5 5L18 7" /><path d="M16 16h7M20 13l3 3-3 3" /></>;
    case "mail":
      return <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>;
    case "mail-lock":
      return <><rect x="2" y="5" width="15" height="13" rx="2" /><path d="m2 7 7.5 6L17 7" /><rect x="15" y="13" width="8" height="7" rx="1.5" /><path d="M17 13v-1.5a2 2 0 0 1 4 0V13" /></>;
    case "refresh":
      return <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.5-2L20 9M4 15l2.4 2a7 7 0 0 0 11.5-2" /></>;
    case "close":
      return <><path d="M18 6 6 18M6 6l12 12" /></>;
    case "unavailable":
      return <><circle cx="12" cy="12" r="9" /><path d="m8 8 8 8" /></>;
    case "link-off":
      return <><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 0 1 0 10h-2" /><path d="M8 12h8" /><path d="m3 3 18 18" /></>;
    case "manager":
      return <><circle cx="12" cy="8" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /><path d="M4 4h4M6 2v4" /></>;
    case "admin":
      return <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>;
    case "check-circle":
      return <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>;
    case "lock":
      return <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>;
    case "send":
      return <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>;
    case "settings":
      return <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></>;
    case "info":
      return <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>;
    case "warning":
      return <><path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>;
    case "clock":
      return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
    case "map-pin":
      return <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>;
    case "badge":
      return <><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M9 6V4h6v2M8 12h8M8 16h5" /><circle cx="12" cy="10" r="1" /></>;
    case "tune":
      return <><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" /></>;
    case "heart":
      return <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />;
    case "log-out":
      return <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>;
    case "account-off":
      return <><circle cx="10" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 9.5-4.9M16 16l6 6M22 16l-6 6" /></>;
    case "cloud-off":
      return <><path d="m3 3 18 18" /><path d="M5.7 5.7A5.5 5.5 0 0 0 6 16h10.3M18.4 18A5 5 0 0 0 18 8h-1.3A7 7 0 0 0 8.1 4.2" /></>;
    case "workspace-off":
      return <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 5V3h8v2M3 10h18M4 4l16 16" /></>;
    case "dashboard":
      return <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>;
    case "eye":
      return <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>;
    case "eye-off":
      return <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.1 2.8M6.1 6.2C3.4 8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3-.4" /></>;
  }
}

export function UiIcon({ name, className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement> & { name: UiIconName }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common} {...props}>
      {paths(name)}
    </svg>
  );
}
