"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";

const navigation = [
  ["Product", "#product"],
  ["How it works", "#how-it-works"],
  ["Guest Experience", "#guest-experience"],
  ["Media Hub", "#media-hub"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-3 px-margin-mobile md:px-margin">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-label-md font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/sign-in"
            className="hidden text-body-sm text-on-surface-variant sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="hidden min-[360px]:block whitespace-nowrap rounded-full bg-primary px-3 py-2.5 text-[12px] font-semibold text-on-primary sm:px-4 sm:text-label-md"
          >
            Start planning
          </Link>
          <button
            ref={toggle}
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant text-primary lg:hidden"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path
                d={open ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!open}
        className="border-t border-outline-variant/50 bg-surface px-5 py-4 lg:hidden"
      >
        {navigation.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-label-md hover:bg-surface-container"
          >
            {label}
          </a>
        ))}
        <Link
          href="/sign-in"
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-3 text-label-md text-primary hover:bg-surface-container"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          onClick={() => setOpen(false)}
          className="mt-2 block rounded-lg bg-primary px-3 py-3 text-center text-label-md font-semibold text-on-primary"
        >
          Start planning
        </Link>
      </nav>
    </header>
  );
}
