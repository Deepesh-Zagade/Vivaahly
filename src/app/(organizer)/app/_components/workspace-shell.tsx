"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { subscribeToWorkspaceReconciliation } from "@/app/(organizer)/app/_components/workspace-reconciliation";
import {
  isSidebarEffectivelyExpanded,
  type SidebarMode,
} from "@/app/(organizer)/app/_components/workspace-sidebar-state";
import { Brand } from "@/components/brand";
import { UiIcon, type UiIconName } from "@/components/ui-icon";
import { LogoutButton } from "@/app/(organizer)/app/_components/logout-button";

type WorkspaceShellProps = {
  children: React.ReactNode;
  organizer: { name: string; role: "ADMIN" | "MANAGER" };
  wedding: {
    coupleName: string;
    eyebrow: string;
    dateLabel: string;
    location: string;
    countdownLabel: string;
  };
};

type NavigationItem = {
  label: string;
  icon: UiIconName;
  href?: string;
};

const navigation: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Planning",
    items: [
      { label: "Dashboard", icon: "dashboard", href: "/app" },
      { label: "Events", icon: "sparkles", href: "/app/events" },
      { label: "Guests", icon: "users" },
      { label: "Invitations & RSVP", icon: "mail" },
      { label: "Tasks", icon: "clipboard-check" },
      { label: "Calendar", icon: "calendar" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Vendors", icon: "store" },
      { label: "Expenses", icon: "receipt" },
      { label: "Media", icon: "image" },
    ],
  },
  {
    label: "Wedding",
    items: [
      { label: "Wedding Website", icon: "globe" },
      { label: "Organizers", icon: "admin", href: "/app/organizers" },
      { label: "Wedding Settings", icon: "tune", href: "/app/settings" },
    ],
  },
];

export function WorkspaceShell({
  children,
  organizer,
  wedding,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("default");
  const [wideSidebarViewport, setWideSidebarViewport] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () =>
      subscribeToWorkspaceReconciliation({
        windowTarget: window,
        documentTarget: document,
        getVisibilityState: () => document.visibilityState,
        refresh: () => router.refresh(),
      }),
    [router],
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const synchronizeViewport = () => setWideSidebarViewport(query.matches);
    synchronizeViewport();
    query.addEventListener("change", synchronizeViewport);
    return () => query.removeEventListener("change", synchronizeViewport);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const expanded = sidebarMode === "expanded";
  const collapsed = sidebarMode === "collapsed";
  const effectivelyExpanded = isSidebarEffectivelyExpanded(
    sidebarMode,
    wideSidebarViewport,
  );
  const sidebarWidth = expanded
    ? "w-72"
    : collapsed
      ? "w-20"
      : "w-20 xl:w-72";
  const showLabels = expanded
    ? "flex"
    : collapsed
      ? "hidden"
      : "hidden xl:flex";
  const showMarkOnly = expanded
    ? "hidden"
    : collapsed
      ? "flex"
      : "flex xl:hidden";
  function toggleSidebar() {
    setSidebarMode(effectivelyExpanded ? "collapsed" : "expanded");
  }

  return (
    <div className="workspace-page min-h-screen bg-background text-on-surface md:flex md:h-screen md:overflow-hidden">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/70 bg-surface px-4 py-3 md:hidden">
        <Brand href="/app" />
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-primary transition-colors hover:bg-surface-container-high"
        >
          <UiIcon name="menu" />
        </button>
      </header>

      <div
        aria-hidden="true"
        onClick={() => {
          setDrawerOpen(false);
          setSidebarMode("collapsed");
        }}
        className={`fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-sm transition-opacity ${
          drawerOpen
            ? "pointer-events-auto opacity-100"
            : expanded
              ? "hidden pointer-events-auto opacity-100 md:block xl:hidden"
              : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={drawerRef}
        aria-label="Mobile workspace navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col overflow-hidden border-r border-outline-variant/70 bg-surface-container-low p-5 shadow-2xl transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 pb-4">
            <Brand href="/app" />
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary"
            >
              <UiIcon name="close" />
            </button>
          </div>
          <div className="workspace-nav-scroll min-h-0 flex-1 overflow-y-auto pr-1">
            <WorkspaceNavigation
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
              showLabels="flex"
            />
          </div>
        </div>
        <div className="shrink-0 bg-surface-container-low pt-3">
          <OrganizerIdentity organizer={organizer} showLabels="flex" />
        </div>
      </aside>

      <aside
        aria-label="Workspace navigation"
        className={`fixed inset-y-0 left-0 z-50 hidden h-screen flex-col border-r border-outline-variant/70 bg-surface-container-low p-3 shadow-sm transition-[width] duration-300 md:flex xl:relative ${sidebarWidth}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-center border-b border-outline-variant/60 px-1 pb-3">
            <div className="min-w-0 overflow-hidden">
              <div className={showLabels}>
                <Brand href="/app" />
              </div>
              <div className={showMarkOnly}>
                <Brand href="/app" showWordmark={false} />
              </div>
            </div>
          </div>
          <div className="workspace-nav-scroll -mr-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2.5">
            <WorkspaceNavigation pathname={pathname} showLabels={showLabels} />
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={effectivelyExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={effectivelyExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3.5 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface-variant shadow-md transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <UiIcon name={effectivelyExpanded ? "arrow-left" : "arrow-right"} className="h-3.5 w-3.5" />
        </button>
        <div className="shrink-0 bg-surface-container-low pt-3">
          <OrganizerIdentity organizer={organizer} showLabels={showLabels} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:ml-20 md:h-screen md:overflow-y-auto xl:ml-0">
        <header className="border-b border-outline-variant/70 bg-surface px-4 py-2.5 sm:px-6 lg:sticky lg:top-0 lg:z-40 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-7">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
                {wedding.eyebrow}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="truncate font-headline-lg text-2xl font-normal tracking-tight text-on-surface lg:text-[1.75rem]">
                  {wedding.coupleName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <UiIcon name="calendar" className="h-3.5 w-3.5 text-primary" />
                    {wedding.dateLabel}
                  </span>
                  <span aria-hidden="true" className="text-outline">·</span>
                  <span className="flex items-center gap-1">
                    <UiIcon name="map-pin" className="h-3.5 w-3.5 text-primary" />
                    {wedding.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant lg:flex">
              <UiIcon name="users" className="h-4 w-4 text-primary" />
              <span>Private family workspace</span>
              <span aria-hidden="true" className="text-outline">·</span>
              <strong className="font-semibold capitalize text-primary">{organizer.role.toLowerCase()}</strong>
            </div>
            <span className="inline-flex min-h-9 self-start items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary sm:self-center sm:justify-self-end">
              <UiIcon name="clock" className="h-4 w-4" />
              {wedding.countdownLabel}
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function WorkspaceNavigation({
  pathname,
  onNavigate,
  showLabels,
}: {
  pathname: string;
  onNavigate?: () => void;
  showLabels: string;
}) {
  const alignment =
    showLabels === "hidden"
      ? "justify-center"
      : showLabels === "hidden xl:flex"
        ? "justify-center xl:justify-start"
        : "justify-start";

  return (
    <nav className="flex flex-col gap-5 pt-5 text-sm">
      {navigation.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className={`${showLabels} px-3 text-[11px] font-semibold uppercase tracking-wider text-outline`}>
            {group.label}
          </span>
          {group.items.map((item) => {
            const active = item.href
              ? item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href)
              : false;
            const content = (
              <>
                <UiIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                <span className={`${showLabels} min-w-0 flex-1 items-center justify-between gap-2`}>
                  <span className="truncate">{item.label}</span>
                  {!item.href ? (
                    <span className="rounded-full bg-surface-container-high px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-outline">
                      Soon
                    </span>
                  ) : null}
                </span>
              </>
            );
            const classes = `group relative flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
              active
                ? "bg-primary text-on-primary shadow-sm"
                : item.href
                  ? "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  : "cursor-default text-outline"
            } ${alignment}`;

            return item.href ? (
              <Link key={item.label} href={item.href} onClick={onNavigate} className={classes} title={item.label}>
                {content}
              </Link>
            ) : (
              <div key={item.label} className={classes} title={`${item.label} — coming soon`} aria-disabled="true">
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function OrganizerIdentity({
  organizer,
  showLabels,
}: {
  organizer: WorkspaceShellProps["organizer"];
  showLabels: string;
}) {
  const identityAlignment =
    showLabels === "hidden"
      ? "justify-center"
      : showLabels === "hidden xl:flex"
        ? "justify-center xl:justify-between"
        : "justify-between";
  const initials = organizer.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-outline-variant/60 pt-4">
      <div className={`flex items-center gap-2 rounded-xl border border-outline-variant/70 bg-white p-2.5 shadow-sm ${identityAlignment}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-xs font-semibold text-primary">
            {initials}
          </span>
          <span className={`${showLabels} min-w-0 flex-col`}>
            <span className="truncate text-xs font-semibold text-on-surface">{organizer.name}</span>
            <span className="text-[11px] font-medium capitalize text-secondary">{organizer.role.toLowerCase()}</span>
          </span>
        </div>
        <div className={showLabels}>
          <LogoutButton compact />
        </div>
      </div>
    </div>
  );
}
