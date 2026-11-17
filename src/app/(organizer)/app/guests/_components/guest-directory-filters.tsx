"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UiIcon } from "@/components/ui-icon";
import { GuestDirectoryNavigationContext } from "@/app/(organizer)/app/guests/_components/guest-directory-navigation";
import {
  GUEST_TAG_LABELS,
  GUEST_TAGS,
  type GuestTag,
  type GuestType,
} from "@/modules/guests/guest.types";

type DirectoryFilters = {
  q?: string;
  guestType?: GuestType;
  tag?: GuestTag;
  eventId?: string;
  pageSize?: number;
};

type FilterValues = {
  q: string;
  guestType: GuestType | "";
  tag: GuestTag | "";
  eventId: string;
};

type EventOption = { id: string; label: string };

const emptyFilters: FilterValues = {
  q: "",
  guestType: "",
  tag: "",
  eventId: "",
};

export function GuestDirectoryFilters({
  filters,
  events,
  children,
}: {
  filters: DirectoryFilters;
  events: EventOption[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<FilterValues>(() =>
    valuesFromFilters(filters),
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeCount = [filters.guestType, filters.tag, filters.eventId].filter(
    Boolean,
  ).length;
  const hasAppliedFilters = Boolean(activeCount || filters.q);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function updateValue<Key extends keyof FilterValues>(
    key: Key,
    value: FilterValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function navigateTo(href: string, scroll = false) {
    startTransition(() => {
      router.replace(href, { scroll });
    });
  }

  function applyFilterValues(next: FilterValues) {
    const query = new URLSearchParams();
    if (next.q.trim()) query.set("q", next.q.trim());
    if (next.guestType) query.set("guestType", next.guestType);
    if (next.tag) query.set("tag", next.tag);
    if (next.eventId) query.set("eventId", next.eventId);
    if (filters.pageSize && filters.pageSize !== 10) {
      query.set("pageSize", String(filters.pageSize));
    }
    setOpen(false);
    navigateTo(query.size ? `/app/guests?${query.toString()}` : "/app/guests");
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilterValues(values);
  }

  return (
    <GuestDirectoryNavigationContext.Provider
      value={{ navigate: navigateTo, pending }}
    >
      <section className="mt-4 rounded-2xl border border-outline-variant/60 bg-white p-3 shadow-sm">
        <form onSubmit={applyFilters}>
          <div className="flex gap-2 xl:hidden">
            <SearchInput
              value={values.q}
              onChange={(value) => updateValue("q", value)}
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={pending}
              className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3.5 text-label-md font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-wait disabled:opacity-65"
            >
              <UiIcon name="tune" className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                  {activeCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="hidden grid-cols-[minmax(15rem,2.2fr)_repeat(3,minmax(8rem,1fr))_auto_auto] gap-2 xl:grid">
            <div>
              <SearchInput
                value={values.q}
                onChange={(value) => updateValue("q", value)}
                disabled={pending}
              />
            </div>
            <FilterFields
              values={values}
              events={events}
              disabled={pending}
              onChange={updateValue}
            />
            <ApplyButton pending={pending} />
            {hasAppliedFilters ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setValues(emptyFilters);
                  applyFilterValues(emptyFilters);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant bg-white px-3.5 text-label-md font-semibold text-on-surface-variant hover:border-primary/35 hover:text-primary disabled:cursor-wait disabled:opacity-65"
              >
                Reset
              </button>
            ) : null}
          </div>
        </form>

        {open ? (
          <div className="fixed inset-0 z-[70] xl:hidden">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 h-full w-full bg-on-surface/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="guest-filter-title"
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-96 sm:rounded-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="guest-filter-title"
                    className="font-headline-lg text-2xl font-semibold text-on-surface"
                  >
                    Filter guests
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Choose any combination of filters.
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface-variant"
                >
                  <UiIcon name="close" className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={applyFilters} className="mt-6 space-y-5">
                <MobileFilterFields
                  values={values}
                  events={events}
                  disabled={pending}
                  onChange={updateValue}
                />
                <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/60 pt-5 sm:flex-row">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setValues(emptyFilters);
                      applyFilterValues(emptyFilters);
                    }}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-surface-container text-label-md font-semibold text-on-surface disabled:opacity-65"
                  >
                    Clear all
                  </button>
                  <ApplyButton
                    pending={pending}
                    label="Apply filters"
                    className="flex-1"
                  />
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>

      <div aria-live="polite" aria-busy={pending}>
        {pending ? <GuestResultsSkeleton /> : children}
      </div>
    </GuestDirectoryNavigationContext.Provider>
  );
}

function SearchInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Search guest or family name</span>
      <UiIcon
        name="search"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Search by guest or family name"
        className="min-h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-3.5 text-body-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-65"
      />
    </label>
  );
}

type FilterFieldsProps = {
  values: FilterValues;
  events: EventOption[];
  disabled: boolean;
  onChange: <Key extends keyof FilterValues>(
    key: Key,
    value: FilterValues[Key],
  ) => void;
};

function FilterFields({ values, events, disabled, onChange }: FilterFieldsProps) {
  return (
    <>
      <select
        value={values.guestType}
        onChange={(event) =>
          onChange(
            "guestType",
            event.target.value as FilterValues["guestType"],
          )
        }
        disabled={disabled}
        aria-label="Guest type"
        className="min-h-11 min-w-0 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-sm outline-none focus:border-primary disabled:cursor-wait"
      >
        <option value="">All types</option>
        <option value="INDIVIDUAL">Individual</option>
        <option value="FAMILY">Family</option>
      </select>
      <select
        value={values.tag}
        onChange={(event) =>
          onChange("tag", event.target.value as FilterValues["tag"])
        }
        disabled={disabled}
        aria-label="Guest tag"
        className="min-h-11 min-w-0 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-sm outline-none focus:border-primary disabled:cursor-wait"
      >
        <option value="">All tags</option>
        {GUEST_TAGS.map((tag) => (
          <option key={tag} value={tag}>
            {GUEST_TAG_LABELS[tag]}
          </option>
        ))}
      </select>
      <select
        value={values.eventId}
        onChange={(event) => onChange("eventId", event.target.value)}
        disabled={disabled}
        aria-label="Invited ceremony"
        className="min-h-11 min-w-0 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-sm outline-none focus:border-primary disabled:cursor-wait"
      >
        <option value="">All ceremonies</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.label}
          </option>
        ))}
      </select>
    </>
  );
}

function MobileFilterFields(props: FilterFieldsProps) {
  const { values, events, disabled, onChange } = props;
  return (
    <>
      <LabeledSelect
        label="Guest type"
        value={values.guestType}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            "guestType",
            event.target.value as FilterValues["guestType"],
          )
        }
      >
        <option value="">All types</option>
        <option value="INDIVIDUAL">Individual</option>
        <option value="FAMILY">Family</option>
      </LabeledSelect>
      <LabeledSelect
        label="Guest tag"
        value={values.tag}
        disabled={disabled}
        onChange={(event) =>
          onChange("tag", event.target.value as FilterValues["tag"])
        }
      >
        <option value="">All tags</option>
        {GUEST_TAGS.map((tag) => (
          <option key={tag} value={tag}>
            {GUEST_TAG_LABELS[tag]}
          </option>
        ))}
      </LabeledSelect>
      <LabeledSelect
        label="Invited ceremony"
        value={values.eventId}
        disabled={disabled}
        onChange={(event) => onChange("eventId", event.target.value)}
      >
        <option value="">All ceremonies</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.label}
          </option>
        ))}
      </LabeledSelect>
    </>
  );
}

function LabeledSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-label-md font-semibold text-on-surface">
        {label}
      </span>
      <select
        {...props}
        className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md outline-none focus:border-primary disabled:cursor-wait"
      >
        {children}
      </select>
    </label>
  );
}

function ApplyButton({
  pending,
  label = "Apply",
  className = "",
}: {
  pending: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-label-md font-semibold text-on-primary hover:bg-primary-container disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? <LoadingSpinner /> : null}
      {pending ? "Applying…" : label}
    </button>
  );
}

function GuestResultsSkeleton() {
  return (
    <section
      className="mt-4 overflow-hidden rounded-2xl border border-outline-variant/60 bg-white shadow-sm"
      role="status"
    >
      <span className="sr-only">Updating guest results</span>
      <div className="hidden grid-cols-[minmax(15rem,1.7fr)_minmax(11rem,1fr)_minmax(12rem,1fr)_2.5rem] gap-4 border-b border-outline-variant/60 bg-surface-container-low px-5 py-2.5 md:grid">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="grid gap-3 border-b border-outline-variant/50 p-3.5 last:border-b-0 md:grid-cols-[minmax(15rem,1.7fr)_minmax(11rem,1fr)_minmax(12rem,1fr)_2.5rem] md:items-center md:px-5 md:py-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="mt-2 h-3 w-28 max-w-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-36 max-w-full" />
            <Skeleton className="mt-2 h-3 w-24 max-w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-44 max-w-full" />
          </div>
        </div>
      ))}
    </section>
  );
}

function Skeleton({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-surface-container-high motion-reduce:animate-none ${className}`}
    />
  );
}

function valuesFromFilters(filters: DirectoryFilters): FilterValues {
  return {
    q: filters.q ?? "",
    guestType: filters.guestType ?? "",
    tag: filters.tag ?? "",
    eventId: filters.eventId ?? "",
  };
}
