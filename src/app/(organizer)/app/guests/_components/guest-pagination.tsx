"use client";

import { useGuestDirectoryNavigation } from "@/app/(organizer)/app/guests/_components/guest-directory-navigation";
import { UiIcon } from "@/components/ui-icon";
import {
  buildGuestDirectoryHref,
  GUEST_PAGE_SIZES,
} from "@/modules/guests/guest.navigation";
import { paginationItems } from "@/modules/guests/guest.pagination";
import type { GuestListQuery } from "@/modules/guests/guest.types";

export function GuestPagination({
  query,
  page,
  pageCount,
  total,
  pageSize,
}: {
  query: GuestListQuery;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const { navigate, pending } = useGuestDirectoryNavigation();
  if (!total) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Guest directory pagination"
      aria-busy={pending}
      className="mt-3 flex flex-col gap-3 rounded-2xl border border-outline-variant/60 bg-white px-3.5 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-start">
        <p className="text-body-sm text-on-surface-variant">
          Showing <strong className="text-on-surface">{first}–{last}</strong> of{" "}
          <strong className="text-on-surface">{total}</strong> records
          <span className="hidden sm:inline"> · Page {page} of {Math.max(pageCount, 1)}</span>
        </p>
        <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="hidden sm:inline">Results per page</span>
          <span className="sm:hidden">Rows</span>
          <select
            value={pageSize}
            disabled={pending}
            onChange={(event) => {
              const nextPageSize = Number(event.target.value);
              navigate(
                buildGuestDirectoryHref({
                  ...query,
                  page: 1,
                  pageSize: nextPageSize,
                }),
                true,
              );
            }}
            className="min-h-9 rounded-lg border border-outline-variant bg-surface-container-low px-2.5 text-label-md font-semibold text-on-surface outline-none focus:border-primary disabled:cursor-wait disabled:opacity-65"
          >
            {GUEST_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <PaginationLink
            label="Previous"
            page={page - 1}
            query={query}
            disabled={page <= 1}
            icon="previous"
          />
          {paginationItems(page, pageCount).map((item) =>
            typeof item === "number" ? (
              <button
                type="button"
                key={item}
                onClick={() =>
                  navigate(
                    buildGuestDirectoryHref({ ...query, page: item, pageSize }),
                    true,
                  )
                }
                disabled={pending}
                aria-label={`Go to guest page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-label-md font-semibold transition-colors disabled:cursor-wait disabled:opacity-65 ${item === page ? "bg-primary text-on-primary shadow-sm" : "text-on-surface hover:bg-surface-container"}`}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="inline-flex h-9 min-w-7 items-center justify-center text-outline"
              >
                …
              </span>
            ),
          )}
          <PaginationLink
            label="Next"
            page={page + 1}
            query={query}
            disabled={page >= pageCount}
            icon="next"
          />
        </div>
      ) : null}
    </nav>
  );
}

function PaginationLink({
  label,
  page,
  query,
  disabled,
  icon,
}: {
  label: string;
  page: number;
  query: GuestListQuery;
  disabled: boolean;
  icon: "previous" | "next";
}) {
  const { navigate, pending } = useGuestDirectoryNavigation();
  const classes =
    "inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-3 text-label-sm font-semibold transition-colors";
  if (disabled || pending) {
    return (
      <span aria-disabled="true" className={`${classes} cursor-not-allowed text-outline`}>
        {icon === "previous" ? <UiIcon name="arrow-left" className="h-3.5 w-3.5" /> : null}
        <span className="hidden sm:inline">{label}</span>
        {icon === "next" ? <UiIcon name="arrow-right" className="h-3.5 w-3.5" /> : null}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        navigate(
          buildGuestDirectoryHref({ ...query, page, pageSize: query.pageSize }),
          true,
        )
      }
      className={`${classes} bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-primary`}
    >
      {icon === "previous" ? <UiIcon name="arrow-left" className="h-3.5 w-3.5" /> : null}
      <span className="hidden sm:inline">{label}</span>
      {icon === "next" ? <UiIcon name="arrow-right" className="h-3.5 w-3.5" /> : null}
    </button>
  );
}
