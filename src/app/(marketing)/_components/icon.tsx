import type { SVGProps } from "react";

// Small, local line icons keep the static illustrations independent of an icon font.
const paths: Record<string, string> = {
  celebration: "m3 21 5-14 9 9-14 5Zm5-14 9 9M14 3v3m4-1 2-2m-1 7h3M11 8l2-2",
  groups:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7a4 4 0 0 1 0 7",
  event:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2m2 10h2m3 0h2m3 0h1M7 17h2m3 0h2",
  checklist: "m3 6 2 2 4-4m-6 9 2 2 4-4m-6 9 2 2 4-4M12 6h9m-9 7h9m-9 7h9",
  receipt_long:
    "M5 3 7 4l2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1V3Zm3 5h8m-8 4h8m-8 4h5",
  table_chart: "M3 3h18v18H3V3Zm0 6h18M9 9v12m6-12v12",
  chat: "M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9ZM7 8h10M7 12h7",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1m-6 7v4m-3 0h6",
  contact_phone:
    "M4 3h16v18H4V3Zm4 12h8m-8 3h8m-4-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  payments: "M2 5h20v14H2V5Zm10 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M5 9v6m14-6v6",
  arrow_forward: "M4 12h16m-6-6 6 6-6 6",
  hub: "M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm-5-9h3v3H4V3Zm13 0h3v3h-3V3ZM4 18h3v3H4v-3Zm13 0h3v3h-3v-3M7 6l3 4m4 4 3 4m0-12-3 4m-4 4-3 4",
  check_circle: "M22 11v1a10 10 0 1 1-6-9m-7 8 3 3L22 4",
  person_add:
    "M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m12-3v6m-3-3h6",
  splitscreen: "M3 3h18v7H3V3Zm0 11h18v7H3v-7Z",
  assignment_ind:
    "M8 3h8v4H8V3ZM8 5H4v16h16V5h-4m-4 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-4 5v-1a4 4 0 0 1 8 0v1",
  folder_shared:
    "M3 5h7l2 3h9v13H3V5Zm9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-4 5v-1a4 4 0 0 1 8 0v1",
  location_on:
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  person:
    "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  check: "m5 12 4 4L19 6",
  add: "M12 5v14M5 12h14",
  local_florist:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-7c4 0 4 4 3 6 6-2 8 4 3 6 2 6-4 8-6 3-3 5-8 2-6-3-5-2-3-8 3-6-2-3-1-6 3-6Z",
  restaurant:
    "M5 2v7m4-7v7M3 2v5a4 4 0 0 0 8 0V2M7 11v11M20 2c-4 2-5 7-5 11h5m0-11v20",
  photo_camera: "M3 7h4l2-3h6l2 3h4v14H3V7Zm9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  music_note:
    "M9 18V5l12-3v13M9 18a3 3 0 1 1-3-3c2 0 3 1 3 3Zm12-3a3 3 0 1 1-3-3c2 0 3 1 3 3Z",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
  translate:
    "M3 5h12M9 2v3m3 0c0 6-4 10-9 12m2-9c2 4 4 6 8 8m1 5 4-12 4 12m-7-4h6",
  lock: "M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 5v2",
  visibility_off:
    "m3 3 18 18M9 5c7-2 11 5 13 7l-4 5M6 6 2 12c3 5 7 8 13 6m-6-9a4 4 0 0 0 6 6",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Zm-5 10 3 3 7-7",
  mark_email_read: "M3 5h18v14H3V5Zm0 0 9 8 9-8m-7 12 3 3 5-5",
  storefront:
    "M3 3h18l1 6a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2l1-6Zm0 9v9h18v-9M9 21v-7h6v7",
  currency_rupee: "M5 3h14M5 7h14M6 3c10 0 10 10 0 10l10 8",
  smartphone: "M6 2h12v20H6V2Zm0 3h12M6 18h12m-7 2h2",
  photo_library: "M6 3h16v16H6V3ZM2 7v16h16M6 15l5-5 3 3 3-2 5 5m-5-10h.01",
};
const aliases: Record<string, string> = {
  people: "groups",
  event_available: "event",
  calendar_month: "event",
  task_alt: "check_circle",
};

export function Icon({
  name,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { name: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block h-[1em] w-[1em] shrink-0 align-middle ${className}`}
      {...props}
    >
      <path d={paths[aliases[name] ?? name] ?? paths.check_circle} />
    </svg>
  );
}
