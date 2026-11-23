"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UiIcon } from "@/components/ui-icon";
import type {
  InvitationCampaignProgress,
  InvitationDeliveryStatus,
  InvitationDeliverySummary,
} from "@/modules/guest-invitations/guest-invitation.types";
import type { GuestTag, GuestType } from "@/modules/guests/guest.types";
import { RequestTimeoutError, fetchWithTimeout } from "@/shared/http/fetch-with-timeout";

export type InvitationHubItem = {
  guestId: string;
  guestType: GuestType;
  displayName: { en: string; mr?: string };
  primaryContact: {
    name: { en: string; mr?: string };
    email?: string;
    phone?: string;
  };
  tags: GuestTag[];
  invitationStatus: "ACTIVE" | "REVOKED";
  deliveryStatus: InvitationDeliveryStatus;
  assignedEvents: Array<{
    id: string;
    title: { en: string; mr?: string };
    startAt: string;
    endAt: string;
  }>;
  lastSentAt: string | null;
  latestError: string | null;
  latestCampaignId: string | null;
};

type HubProps = {
  items: InvitationHubItem[];
  summary: InvitationDeliverySummary;
  eligibleGuestIds: string[];
  retryableGuestIds: string[];
  latestCampaign: SerializedCampaign | null;
  events: Array<{ id: string; title: string }>;
  query: {
    q?: string;
    status?: InvitationDeliveryStatus;
    guestType?: GuestType;
    eventId?: string;
    page: number;
    pageSize: number;
  };
  total: number;
  page: number;
  pageCount: number;
};

type SerializedCampaign = Omit<
  InvitationCampaignProgress,
  "startedAt" | "completedAt" | "createdAt" | "updatedAt"
> & {
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DialogState =
  | { type: "review"; guestIds: string[]; resend: boolean }
  | { type: "revoke"; item: InvitationHubItem }
  | { type: "restore"; item: InvitationHubItem }
  | { type: "email"; item: InvitationHubItem }
  | null;

type ApiResponse = {
  data?: { campaign?: SerializedCampaign };
  error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } };
};

const statusLabels: Record<InvitationDeliveryStatus, string> = {
  NOT_SENT: "Not sent",
  SENDING: "Sending",
  SENT: "Sent",
  FAILED: "Failed",
  REVOKED: "Revoked",
  MISSING_EMAIL: "Missing email",
  NEEDS_EVENTS: "Needs ceremonies",
  RESTORED: "Restored",
};

function initials(value: string) {
  return value
    .split(/\s+|&/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusClass(status: InvitationDeliveryStatus) {
  if (status === "SENT") return "bg-emerald-50 text-emerald-800";
  if (status === "FAILED") return "bg-error-container text-on-error-container";
  if (status === "MISSING_EMAIL") return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  if (status === "NEEDS_EVENTS") return "bg-secondary-fixed text-secondary";
  if (status === "RESTORED") return "bg-amber-50 text-amber-800";
  if (status === "SENDING") return "bg-primary-fixed text-on-primary-fixed-variant";
  if (status === "REVOKED") return "bg-surface-container text-outline";
  return "bg-surface-container-high text-on-surface-variant";
}

function formatSentAt(value: string | null) {
  if (!value) return "Never sent";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function queryHref(
  query: HubProps["query"],
  overrides: Partial<HubProps["query"]>,
) {
  const next = { ...query, ...overrides };
  const parameters = new URLSearchParams();
  if (next.q) parameters.set("q", next.q);
  if (next.status) parameters.set("status", next.status);
  if (next.guestType) parameters.set("guestType", next.guestType);
  if (next.eventId) parameters.set("eventId", next.eventId);
  if (next.page > 1) parameters.set("page", String(next.page));
  if (next.pageSize !== 10) parameters.set("pageSize", String(next.pageSize));
  return parameters.size ? `/app/invitations?${parameters}` : "/app/invitations";
}

export function InvitationHub(props: HubProps) {
  const router = useRouter();
  const [navigationPending, startNavigation] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>(null);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const pageSelectionRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    q: props.query.q ?? "",
    status: props.query.status ?? "",
    guestType: props.query.guestType ?? "",
    eventId: props.query.eventId ?? "",
  });

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 6_000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const pageEligible = props.items.filter(
    (item) => ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus),
  );
  const selectedPageCount = pageEligible.filter((item) => selected.has(item.guestId)).length;
  const selectedRetryCount = [...selected].filter((guestId) => props.retryableGuestIds.includes(guestId)).length;
  const allPageEligibleSelected = Boolean(pageEligible.length) && selectedPageCount === pageEligible.length;

  useEffect(() => {
    if (pageSelectionRef.current) {
      pageSelectionRef.current.indeterminate = selectedPageCount > 0 && !allPageEligibleSelected;
    }
  }, [allPageEligibleSelected, selectedPageCount]);

  function navigate(href: string) {
    startNavigation(() => router.push(href, { scroll: false }));
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelected(new Set());
    navigate(
      queryHref(props.query, {
        q: filters.q.trim() || undefined,
        status: (filters.status || undefined) as InvitationDeliveryStatus | undefined,
        guestType: (filters.guestType || undefined) as GuestType | undefined,
        eventId: filters.eventId || undefined,
        page: 1,
      }),
    );
  }

  function toggleGuest(guestId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  }

  function togglePageSelection() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageEligibleSelected) {
        for (const item of pageEligible) next.delete(item.guestId);
      } else {
        for (const item of pageEligible) next.add(item.guestId);
      }
      return next;
    });
  }

  async function createCampaign(guestIds: string[], resend: boolean) {
    setActionPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout("/api/v1/email-campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guestIds, resend }),
      });
      const body = (await response.json()) as ApiResponse;
      if (!response.ok || !body.data?.campaign) {
        setError(body.error?.message ?? "We couldn't prepare these invitations.");
        return;
      }
      router.push(`/app/invitations/campaigns/${body.data.campaign.id}?start=1`);
    } catch (caught) {
      setError(
        caught instanceof RequestTimeoutError
          ? "Vivaahly took too long to prepare the invitations. Please try again."
          : "We couldn't reach Vivaahly. Check your connection and try again.",
      );
    } finally {
      setActionPending(false);
    }
  }

  async function revoke(item: InvitationHubItem) {
    setActionPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/guest-invitations/${item.guestId}/revoke`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = (await response.json()) as ApiResponse;
        setError(body.error?.message ?? "We couldn't revoke this invitation.");
        return;
      }
      setDialog(null);
      setNotice(`Invitation access for ${item.displayName.en} was revoked.`);
      router.refresh();
    } catch {
      setError("We couldn't reach Vivaahly. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  async function restore(item: InvitationHubItem) {
    setActionPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/guest-invitations/${item.guestId}/restore`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = (await response.json()) as ApiResponse;
        setError(body.error?.message ?? "We couldn't restore this invitation.");
        return;
      }
      setDialog(null);
      setNotice(`Invitation access for ${item.displayName.en} was restored with a new private link.`);
      router.refresh();
    } catch {
      setError("We couldn't reach Vivaahly. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  async function saveEmail(sendAfterSave: boolean) {
    if (dialog?.type !== "email") return;
    const validationMessage = validateInviteeEmail(email);
    if (validationMessage) {
      setEmailError(validationMessage);
      return;
    }
    setActionPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/guest-invitations/${dialog.item.guestId}/email`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (!response.ok) {
        const body = (await response.json()) as ApiResponse;
        const fieldError = body.error?.details?.fieldErrors?.email?.[0];
        if (fieldError) {
          setEmailError(fieldError);
          return;
        }
        setError(body.error?.message ?? "We couldn't save this email address.");
        return;
      }
      if (sendAfterSave) {
        await createCampaign([dialog.item.guestId], false);
        return;
      }
      setDialog(null);
      setNotice("The primary email address was saved.");
      router.refresh();
    } catch {
      setError("We couldn't reach Vivaahly. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  function openEmail(item: InvitationHubItem) {
    setEmail(item.primaryContact.email ?? "");
    setEmailError(null);
    setDialog({ type: "email", item });
  }

  const invitationReturnTo = queryHref(props.query, {});
  const latestCampaignInProgress = Boolean(
    props.latestCampaign && ["DRAFT", "SENDING"].includes(props.latestCampaign.status),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-4xl font-normal tracking-tight text-primary sm:text-5xl">
              Guest Invitations
            </h1>
            {latestCampaignInProgress ? (
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                Campaign in progress
              </span>
            ) : null}
            {props.latestCampaign && !latestCampaignInProgress ? (
              <Link
                href={`/app/invitations/campaigns/${props.latestCampaign.id}`}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors hover:bg-white ${props.latestCampaign.failed ? "border-error/20 bg-error-container/55 text-error" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
              >
                <UiIcon name={props.latestCampaign.failed ? "warning" : "check-circle"} className="h-3.5 w-3.5" />
                Latest result · {props.latestCampaign.failed ? `${props.latestCampaign.failed} failed` : `${props.latestCampaign.sent} sent`}
                <UiIcon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:text-base">
            Send personalized wedding invitations and manage each guest&apos;s private invitation access.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/invitations/preview"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface shadow-sm hover:bg-surface-container-low"
          >
            <UiIcon name="eye" className="h-4 w-4" />Preview email template
          </Link>
          <button
            type="button"
            disabled={!props.summary.eligibleToSend}
            onClick={() => {
              setSelected(new Set(props.eligibleGuestIds));
              document.getElementById("invitation-directory")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-md hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UiIcon name="send" className="h-4 w-4" />Send invitations
          </button>
        </div>
      </header>

      {notice ? <Feedback tone="success" message={notice} /> : null}
      {error ? <Feedback tone="error" message={error} /> : null}

      {props.latestCampaign && latestCampaignInProgress ? (
        <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-primary/15 bg-primary-fixed/35 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <UiIcon name={props.latestCampaign.failed ? "warning" : props.latestCampaign.pending ? "mail-out" : "check-circle"} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Latest delivery</p>
              <h2 className="mt-0.5 text-sm font-semibold text-on-surface">{latestCampaignTitle(props.latestCampaign)}</h2>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                {props.latestCampaign.sent} sent · {props.latestCampaign.pending} pending · {props.latestCampaign.failed} failed
              </p>
            </div>
          </div>
          <Link
            href={`/app/invitations/campaigns/${props.latestCampaign.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            {props.latestCampaign.pending ? "Continue campaign" : "View latest results"}<UiIcon name="arrow-right" className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Metric label="Eligible to send" value={props.summary.eligibleToSend} total={props.summary.total} helper={`of ${props.summary.total} total`} icon="mail-out" />
        <Metric label="Sent & active" value={props.summary.sent} total={props.summary.total} helper={`${percentage(props.summary.sent, props.summary.total)}%`} icon="check-circle" accent="success" />
        <Metric label="Ready to send" value={props.summary.notSent + props.summary.restored} total={props.summary.total} helper="In queue" icon="clock" accent="muted" />
        <Metric label="Delivery failed" value={props.summary.failed} total={props.summary.total} helper="Action required" icon="warning" accent="error" />
        <Metric label="Missing email" value={props.summary.missingEmail} total={props.summary.total} helper="Excluded" icon="mail-lock" accent="warning" wide />
      </section>

      <section id="invitation-directory" className="relative mt-6 rounded-2xl border border-outline-variant/70 bg-white shadow-sm">
        {selected.size ? (
          <div className="sticky top-[4.25rem] z-20 flex flex-col justify-between gap-3 border-b border-primary/10 bg-primary-fixed/95 p-4 shadow-md backdrop-blur sm:flex-row sm:items-center md:top-0 lg:top-[4.75rem]">
            <div>
              <p className="text-sm font-semibold text-primary">{selected.size} guests selected</p>
              <button type="button" onClick={() => setSelected(new Set())} className="mt-1 text-xs font-semibold text-on-surface-variant underline">Clear selection</button>
              {selected.size < props.eligibleGuestIds.length ? (
                <button
                  type="button"
                  onClick={() => setSelected(new Set(props.eligibleGuestIds))}
                  className="ml-4 mt-1 text-xs font-semibold text-primary underline"
                >
                  Select all {props.eligibleGuestIds.length} eligible guests across filtered pages
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setDialog({ type: "review", guestIds: [...selected], resend: [...selected].some((guestId) => props.retryableGuestIds.includes(guestId)) })}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
            >
              <UiIcon name="mail-out" className="h-4 w-4" />{selectedRetryCount === selected.size ? "Review & retry invitations" : selectedRetryCount ? "Review sends & retries" : "Review & send invitations"}
            </button>
          </div>
        ) : null}

        <form onSubmit={submitFilters} className="grid gap-3 border-b border-outline-variant/60 p-4 lg:grid-cols-[minmax(14rem,1fr)_12rem_12rem_12rem_auto]">
          <label className="relative">
            <span className="sr-only">Search guests</span>
            <UiIcon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-outline" />
            <input
              value={filters.q}
              onChange={(event) => setFilters((value) => ({ ...value, q: event.target.value }))}
              placeholder="Search by guest, family, or email"
              className="min-h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <FilterSelect value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} label="All statuses">
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.guestType} onChange={(value) => setFilters((current) => ({ ...current, guestType: value }))} label="All guest types">
            <option value="INDIVIDUAL">Individuals</option><option value="FAMILY">Families</option>
          </FilterSelect>
          <FilterSelect value={filters.eventId} onChange={(value) => setFilters((current) => ({ ...current, eventId: value }))} label="All ceremonies">
            {props.events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </FilterSelect>
          <div className="flex gap-2">
            <button type="submit" className="min-h-10 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
            <button type="button" onClick={() => { setSelected(new Set()); setFilters({ q: "", status: "", guestType: "", eventId: "" }); navigate("/app/invitations"); }} title="Reset filters" aria-label="Reset filters" className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:text-primary">
              <UiIcon name="refresh" className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low/80 text-[11px] uppercase tracking-wider text-on-surface-variant">
              <tr><th className="w-12 p-4"><input ref={pageSelectionRef} type="checkbox" checked={allPageEligibleSelected} disabled={!pageEligible.length || navigationPending} onChange={togglePageSelection} aria-label="Select all eligible invitations on this page" className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-35" /></th><th className="p-4">Guest or family</th><th className="p-4">Contact details</th><th className="p-4">Assigned ceremonies</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {navigationPending
                ? Array.from({ length: 5 }, (_, index) => <InvitationRowSkeleton key={index} />)
                : props.items.map((item) => (
                    <InvitationRow key={item.guestId} item={item} selected={selected.has(item.guestId)} selectionActive={selected.size > 0} onToggle={() => toggleGuest(item.guestId)} onDialog={setDialog} onEmail={openEmail} returnTo={invitationReturnTo} />
                  ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-outline-variant/60 lg:hidden">
          {navigationPending
            ? Array.from({ length: 5 }, (_, index) => <InvitationCardSkeleton key={index} />)
            : props.items.map((item) => (
                <InvitationCard key={item.guestId} item={item} selected={selected.has(item.guestId)} selectionActive={selected.size > 0} onToggle={() => toggleGuest(item.guestId)} onDialog={setDialog} onEmail={openEmail} returnTo={invitationReturnTo} />
              ))}
        </div>
        {!props.items.length ? <EmptyFiltered total={props.summary.total} /> : null}

        <footer className="flex flex-col justify-between gap-4 border-t border-outline-variant/60 bg-surface-container-low/70 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
            <span>Showing {props.items.length ? (props.page - 1) * props.query.pageSize + 1 : 0}–{Math.min(props.page * props.query.pageSize, props.total)} of {props.total}</span>
            <label className="flex items-center gap-2">Rows per page
              <select disabled={navigationPending} value={props.query.pageSize} onChange={(event) => navigate(queryHref(props.query, { page: 1, pageSize: Number(event.target.value) }))} className="rounded-lg border border-outline-variant bg-white px-2 py-1.5 disabled:opacity-50">
                <option value="10">10</option><option value="50">50</option><option value="100">100</option>
              </select>
            </label>
          </div>
          <Pagination page={props.page} pageCount={props.pageCount} pending={navigationPending} onPage={(page) => navigate(queryHref(props.query, { page }))} />
        </footer>
      </section>

      {dialog?.type === "review" ? (
        <ReviewDialog
          count={dialog.guestIds.length}
          resend={dialog.resend}
          retryCount={dialog.guestIds.filter((guestId) => props.retryableGuestIds.includes(guestId)).length}
          selectedItems={props.items.filter((item) => dialog.guestIds.includes(item.guestId))}
          pending={actionPending}
          onClose={() => setDialog(null)}
          onConfirm={() => createCampaign(dialog.guestIds, dialog.resend)}
        />
      ) : null}
      {dialog?.type === "revoke" ? <RevokeDialog item={dialog.item} pending={actionPending} onClose={() => setDialog(null)} onConfirm={() => revoke(dialog.item)} /> : null}
      {dialog?.type === "restore" ? <RestoreDialog item={dialog.item} pending={actionPending} onClose={() => setDialog(null)} onConfirm={() => restore(dialog.item)} /> : null}
      {dialog?.type === "email" ? <EmailDialog item={dialog.item} email={email} setEmail={(value) => { setEmail(value); setEmailError(null); }} onValidate={(value) => setEmailError(validateInviteeEmail(value))} error={emailError} pending={actionPending} onClose={() => setDialog(null)} onSave={saveEmail} /> : null}
    </main>
  );
}

function Metric({ label, value, total, helper, icon, accent = "default", wide = false }: { label: string; value: number; total: number; helper: string; icon: Parameters<typeof UiIcon>[0]["name"]; accent?: "default" | "success" | "error" | "warning" | "muted"; wide?: boolean }) {
  const color = accent === "success" ? "text-emerald-700" : accent === "error" ? "text-error" : accent === "warning" ? "text-amber-700" : "text-primary";
  const bar = accent === "success" ? "bg-emerald-600" : accent === "error" ? "bg-error" : accent === "warning" ? "bg-amber-500" : accent === "muted" ? "bg-outline" : "bg-primary";
  const iconColor = accent === "success" ? "text-emerald-700" : accent === "error" ? "text-error" : accent === "warning" ? "text-amber-700" : "text-primary";
  return <article className={`rounded-2xl border border-outline-variant/45 bg-white p-4 shadow-sm ${wide ? "col-span-2 sm:col-span-1" : ""}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p><div className="mt-2 flex flex-wrap items-baseline gap-2"><strong className={`text-3xl leading-none ${color}`}>{value}</strong><span className={`text-xs font-semibold ${color}`}>{helper}</span></div></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low ${iconColor}`}><UiIcon name={icon} className="h-4 w-4" /></span></div><div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-container-high"><div className={`h-full rounded-full ${bar}`} style={{ width: `${percentage(value, total)}%` }} /></div></article>;
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"><option value="">{label}</option>{children}</select>;
}

function InvitationRow({ item, selected, selectionActive, onToggle, onDialog, onEmail, returnTo }: { item: InvitationHubItem; selected: boolean; selectionActive: boolean; onToggle: () => void; onDialog: (dialog: DialogState) => void; onEmail: (item: InvitationHubItem) => void; returnTo: string }) {
  const selectable = ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus);
  const rowClass = item.deliveryStatus === "REVOKED" ? "bg-surface-container-low/80" : item.deliveryStatus === "FAILED" ? "bg-error-container/10" : "hover:bg-surface-container-low/45";
  return <tr aria-selected={selectable ? selected : undefined} onClick={(event) => { if (selectable && !isInteractiveTarget(event.target)) onToggle(); }} className={`${rowClass} ${selectable ? "cursor-pointer transition-colors" : ""} ${selected ? "bg-primary-fixed/35" : ""}`}>
    <td className="p-4 align-middle"><input type="checkbox" aria-label={`Select ${item.displayName.en}`} checked={selected} disabled={!selectable} onChange={onToggle} className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-35" /></td>
    <td className="min-w-56 p-4 align-top"><GuestIdentity item={item} /></td>
    <td className="min-w-52 p-4 align-top text-sm"><p className={item.primaryContact.email ? "text-on-surface" : "italic text-secondary"}>{item.primaryContact.email ?? "No email address on record"}</p>{item.primaryContact.phone ? <p className="mt-1 text-xs text-on-surface-variant">{item.primaryContact.phone}</p> : null}</td>
    <td className="min-w-48 p-4 align-top"><Ceremonies item={item} /></td>
    <td className="min-w-40 p-4 align-middle"><Status item={item} /></td>
    <td className="min-w-52 p-4 align-middle"><div className="flex justify-end"><Actions item={item} selected={selected} selectionActive={selectionActive} onDialog={onDialog} onEmail={onEmail} returnTo={returnTo} /></div></td>
  </tr>;
}

function InvitationCard({ item, selected, selectionActive, onToggle, onDialog, onEmail, returnTo }: { item: InvitationHubItem; selected: boolean; selectionActive: boolean; onToggle: () => void; onDialog: (dialog: DialogState) => void; onEmail: (item: InvitationHubItem) => void; returnTo: string }) {
  const selectable = ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus);
  return <article onClick={(event) => { if (selectable && !isInteractiveTarget(event.target)) onToggle(); }} className={`p-4 ${selectable ? "cursor-pointer transition-colors" : ""} ${selected ? "bg-primary-fixed/35" : ""} ${item.deliveryStatus === "REVOKED" ? "bg-surface-container-low/80" : ""}`}><div className="flex items-start gap-3">{selectable ? <input type="checkbox" aria-label={`Select ${item.displayName.en}`} checked={selected} onChange={onToggle} className="mt-2 h-4 w-4 accent-primary" /> : null}<div className="min-w-0 flex-1"><GuestIdentity item={item} /><div className="mt-4 grid gap-3 min-[480px]:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-outline">Contact</p><p className="mt-1 break-all text-sm text-on-surface">{item.primaryContact.email ?? "No email address"}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-outline">Ceremonies</p><div className="mt-1"><Ceremonies item={item} /></div></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Status item={item} /><Actions item={item} selected={selected} selectionActive={selectionActive} onDialog={onDialog} onEmail={onEmail} returnTo={returnTo} /></div></div></div></article>;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea, label"));
}

function GuestIdentity({ item }: { item: InvitationHubItem }) {
  const revoked = item.deliveryStatus === "REVOKED";
  return <div className={`flex items-start gap-3 ${revoked ? "opacity-60" : ""}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-primary">{initials(item.displayName.en)}</span><div className="min-w-0"><p className={`font-semibold ${revoked ? "text-on-surface-variant" : "text-on-surface"}`}>{item.displayName.en}</p><span className="mt-1 inline-flex rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{item.guestType === "FAMILY" ? "Family" : "Individual"}</span>{item.guestType === "FAMILY" ? <p className="mt-1 text-xs text-on-surface-variant">Primary: {item.primaryContact.name.en}</p> : null}</div></div>;
}

function Ceremonies({ item }: { item: InvitationHubItem }) {
  const names = item.assignedEvents.map((event) => event.title.en);
  return <div><p className="text-sm font-semibold text-on-surface">{names.length} {names.length === 1 ? "ceremony" : "ceremonies"}</p><p className="mt-1 max-w-56 truncate text-xs text-on-surface-variant" title={names.join(", ")}>{names.length ? names.join(", ") : "No ceremonies assigned"}</p></div>;
}

function Status({ item }: { item: InvitationHubItem }) {
  const detail = item.deliveryStatus === "FAILED" ? friendlyFailureMessage(item.latestError) : item.deliveryStatus === "SENT" ? formatSentAt(item.lastSentAt) : item.deliveryStatus === "REVOKED" ? "Invitation access is inactive" : item.deliveryStatus === "MISSING_EMAIL" ? "Add an email to send" : item.deliveryStatus === "NEEDS_EVENTS" ? "Assign at least one ceremony before sending" : item.deliveryStatus === "RESTORED" ? "Previous link revoked. New link not sent." : item.deliveryStatus === "SENDING" ? "Campaign progress is saved" : "Ready to send";
  return <div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.deliveryStatus)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabels[item.deliveryStatus]}</span><p className="mt-1.5 max-w-48 text-xs leading-5 text-on-surface-variant">{detail}</p></div>;
}

function Actions({ item, selected, selectionActive, onDialog, onEmail, returnTo }: { item: InvitationHubItem; selected: boolean; selectionActive: boolean; onDialog: (dialog: DialogState) => void; onEmail: (item: InvitationHubItem) => void; returnTo: string }) {
  const selectable = ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus);
  if (selectionActive && selectable) return <span className="max-w-36 text-right text-xs font-semibold text-on-surface-variant">{selected ? "Included in bulk delivery" : "Select row to include"}</span>;
  if (item.deliveryStatus === "NOT_SENT") return <button type="button" onClick={() => onDialog({ type: "review", guestIds: [item.guestId], resend: false })} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary"><UiIcon name="send" className="h-3.5 w-3.5" />Send</button>;
  if (item.deliveryStatus === "SENT") return <div className="flex flex-nowrap items-center justify-end gap-2"><button type="button" onClick={() => onDialog({ type: "review", guestIds: [item.guestId], resend: true })} className="min-h-9 rounded-lg bg-surface-container px-3 text-xs font-semibold text-on-surface">Resend</button><button type="button" onClick={() => onDialog({ type: "revoke", item })} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-error/20 px-3 text-xs font-semibold text-error"><UiIcon name="link-off" className="h-3.5 w-3.5" />Revoke</button></div>;
  if (item.deliveryStatus === "FAILED") return <button type="button" onClick={() => onDialog({ type: "review", guestIds: [item.guestId], resend: true })} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-error px-3 text-xs font-semibold text-on-error"><UiIcon name="refresh" className="h-3.5 w-3.5" />Retry invitation</button>;
  if (item.deliveryStatus === "SENDING" && item.latestCampaignId) return <Link href={`/app/invitations/campaigns/${item.latestCampaignId}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary">Continue<UiIcon name="arrow-right" className="h-3.5 w-3.5" /></Link>;
  if (item.deliveryStatus === "MISSING_EMAIL") return <button type="button" onClick={() => onEmail(item)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-surface-container px-3 text-xs font-semibold text-on-surface"><UiIcon name="mail" className="h-3.5 w-3.5" />Add email</button>;
  if (item.deliveryStatus === "REVOKED") return <button type="button" onClick={() => onDialog({ type: "restore", item })} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 text-xs font-semibold text-primary"><UiIcon name="refresh" className="h-3.5 w-3.5" />Restore</button>;
  if (item.deliveryStatus === "RESTORED") return <div className="flex w-36 flex-col items-stretch gap-2"><button type="button" onClick={() => onDialog({ type: "review", guestIds: [item.guestId], resend: false })} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary"><UiIcon name="send" className="h-3.5 w-3.5" />Send new link</button><button type="button" onClick={() => onDialog({ type: "revoke", item })} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-error/20 px-3 text-xs font-semibold text-error"><UiIcon name="link-off" className="h-3.5 w-3.5" />Revoke</button></div>;
  if (item.deliveryStatus === "NEEDS_EVENTS") return <Link href={`/app/guests/${item.guestId}/edit?${new URLSearchParams({ returnTo })}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-surface-container px-3 text-xs font-semibold text-on-surface"><UiIcon name="calendar-check" className="h-3.5 w-3.5" />Assign ceremonies</Link>;
  return <span className="text-xs font-medium text-outline">No actions available</span>;
}

function Pagination({ page, pageCount, pending, onPage }: { page: number; pageCount: number; pending: boolean; onPage: (page: number) => void }) {
  if (pageCount <= 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((value) => value >= 1 && value <= pageCount);
  return <nav aria-label="Invitation pages" className="flex items-center gap-1"><button type="button" disabled={pending || page === 1} onClick={() => onPage(page - 1)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-40">Previous</button>{pages.map((value, index) => <span key={value} className="contents">{index && value - pages[index - 1] > 1 ? <span className="px-1 text-outline">…</span> : null}<button type="button" disabled={pending} aria-current={value === page ? "page" : undefined} onClick={() => onPage(value)} className={`h-9 min-w-9 rounded-lg text-xs font-semibold disabled:opacity-40 ${value === page ? "bg-primary text-on-primary" : "bg-white text-on-surface"}`}>{value}</button></span>)}<button type="button" disabled={pending || page === pageCount} onClick={() => onPage(page + 1)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-40">Next</button></nav>;
}

function EmptyFiltered({ total }: { total: number }) {
  return <div className="px-6 py-14 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary"><UiIcon name={total ? "search" : "mail"} /></span><h2 className="mt-4 font-headline-lg text-2xl text-primary">{total ? "No invitations match these filters" : "No guests ready for invitations yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{total ? "Try a different guest, status, type, or ceremony." : "Add an individual guest or family, assign their ceremonies, and return here to send a personalized invitation."}</p>{!total ? <Link href="/app/guests/new?returnTo=%2Fapp%2Finvitations" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary"><UiIcon name="user-plus" className="h-4 w-4" />Add first guest</Link> : null}</div>;
}

function InvitationRowSkeleton() {
  return <tr aria-hidden="true" className="animate-pulse"><td className="p-4"><span className="block h-4 w-4 rounded bg-surface-container-high" /></td><td className="p-4"><div className="flex items-center gap-3"><span className="h-10 w-10 rounded-full bg-surface-container-high" /><div className="space-y-2"><span className="block h-3.5 w-32 rounded bg-surface-container-high" /><span className="block h-2.5 w-16 rounded bg-surface-container" /></div></div></td><td className="p-4"><div className="space-y-2"><span className="block h-3 w-36 rounded bg-surface-container-high" /><span className="block h-2.5 w-24 rounded bg-surface-container" /></div></td><td className="p-4"><div className="space-y-2"><span className="block h-3 w-20 rounded bg-surface-container-high" /><span className="block h-2.5 w-32 rounded bg-surface-container" /></div></td><td className="p-4"><div className="space-y-2"><span className="block h-6 w-20 rounded-full bg-surface-container-high" /><span className="block h-2.5 w-28 rounded bg-surface-container" /></div></td><td className="p-4"><span className="ml-auto block h-9 w-24 rounded-lg bg-surface-container-high" /></td></tr>;
}

function InvitationCardSkeleton() {
  return <article aria-hidden="true" className="animate-pulse p-4"><div className="flex gap-3"><span className="h-10 w-10 rounded-full bg-surface-container-high" /><div className="flex-1 space-y-4"><div className="space-y-2"><span className="block h-4 w-40 rounded bg-surface-container-high" /><span className="block h-3 w-20 rounded bg-surface-container" /></div><div className="grid grid-cols-2 gap-4"><span className="block h-10 rounded bg-surface-container" /><span className="block h-10 rounded bg-surface-container" /></div><div className="flex justify-between"><span className="block h-7 w-24 rounded-full bg-surface-container-high" /><span className="block h-9 w-24 rounded-lg bg-surface-container-high" /></div></div></div></article>;
}

function friendlyFailureMessage(message: string | null) {
  if (!message) return "The most recent delivery failed. Review the email address and try again.";
  if (/invalid [`']?to|example\.com|testing recipient|recipient address/i.test(message)) return "The email provider rejected this recipient address. Use a real deliverable address and try again.";
  return "The email provider could not deliver this invitation. Review the recipient address and retry.";
}

function validateInviteeEmail(value: string) {
  const email = value.trim();
  if (!email) return "Enter the primary invitee email address.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return "Enter a valid email address.";
  return null;
}

function Feedback({ tone, message }: { tone: "success" | "error"; message: string }) {
  return <div role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"} className={`fixed right-4 top-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl sm:right-6 sm:top-6 ${tone === "error" ? "border-error/20 bg-error-container text-on-error-container" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><UiIcon name={tone === "error" ? "warning" : "check-circle"} className="mt-0.5 h-4 w-4 shrink-0" /><span className="leading-5">{message}</span></div>;
}

function DialogFrame({ title, eyebrow, children, actions, onClose, tone = "default" }: { title: string; eyebrow?: string; children: React.ReactNode; actions: React.ReactNode; onClose: () => void; tone?: "default" | "danger" }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-on-surface/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="invitation-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-outline-variant/60 px-5 py-4 sm:px-7"><div>{eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">{eyebrow}</p> : null}<h2 id="invitation-dialog-title" className={`mt-1 font-headline-lg text-3xl ${tone === "danger" ? "text-error" : "text-primary"}`}>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"><UiIcon name="close" className="h-4 w-4" /></button></header><div className="px-5 py-5 sm:px-7">{children}</div><footer className="flex flex-col-reverse justify-end gap-2 border-t border-outline-variant/60 bg-surface-container-low px-5 py-4 sm:flex-row sm:px-7">{actions}</footer></section></div>;
}

function ReviewDialog({ count, resend, retryCount, selectedItems, pending, onClose, onConfirm }: { count: number; resend: boolean; retryCount: number; selectedItems: InvitationHubItem[]; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  const single = count === 1 ? selectedItems[0] : undefined;
  const title = single?.deliveryStatus === "SENT" ? "Review invitation resend" : single?.deliveryStatus === "FAILED" ? "Review failed invitation" : single?.deliveryStatus === "RESTORED" ? "Review restored invitation" : "Review invitation delivery";
  const actionLabel = single?.deliveryStatus === "SENT" ? "Resend invitation" : single?.deliveryStatus === "FAILED" ? "Retry invitation" : single?.deliveryStatus === "RESTORED" ? "Send new link" : count === 1 ? "Send invitation" : retryCount ? `Send or retry ${count}` : `Send ${count} invitations`;
  return <DialogFrame title={title} eyebrow="Final review" onClose={onClose} actions={<><button type="button" disabled={pending} onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant">Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60">{pending ? <><LoadingSpinner className="h-4 w-4" />Preparing…</> : <><UiIcon name="send" className="h-4 w-4" />{actionLabel}</>}</button></>}>
    <div className="rounded-xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">Each recipient receives only the ceremonies assigned to their guest profile. Invitation links remain private and are never displayed in the organizer interface.</div>
    {single ? <SingleInvitationReview item={single} /> : <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><ReviewMetric label="Recipients" value={String(count)} /><ReviewMetric label="First sends" value={String(Math.max(count - retryCount, 0))} /><ReviewMetric label="Failed retries" value={String(retryCount)} /><ReviewMetric label="Ceremony access" value="Assigned only" /></div>}
    {single?.deliveryStatus === "SENT" ? <p className="mt-4 rounded-xl bg-primary-fixed/45 p-3 text-sm text-on-primary-fixed-variant">The existing private link remains active and will be emailed again. Last sent {formatSentAt(single.lastSentAt)}.</p> : single?.deliveryStatus === "FAILED" ? <p className="mt-4 rounded-xl bg-error-container/45 p-3 text-sm text-on-error-container">The failed delivery will be attempted again using the email address shown above.</p> : single?.deliveryStatus === "RESTORED" ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The previously revoked link remains invalid. This sends the newly restored private link.</p> : !single && resend ? <p className="mt-4 rounded-xl bg-primary-fixed/45 p-3 text-sm text-on-primary-fixed-variant">Failed deliveries will be attempted again. Any selected unsent or restored recipients will receive their current private invitation link.</p> : null}
  </DialogFrame>;
}

function SingleInvitationReview({ item }: { item: InvitationHubItem }) {
  const ceremonyNames = item.assignedEvents.map((event) => event.title.en);
  return <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-surface-container p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Recipient</p><p className="mt-1 font-semibold text-primary">{item.displayName.en}</p><p className="mt-1 text-xs text-on-surface-variant">{item.guestType === "FAMILY" ? `Family invitation · Primary: ${item.primaryContact.name.en}` : "Individual invitation"}</p></div><div className="rounded-xl bg-surface-container p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Deliver to</p><p className="mt-1 break-all font-semibold text-primary">{item.primaryContact.email}</p><p className="mt-1 text-xs text-on-surface-variant">Email delivery</p></div><div className="rounded-xl bg-surface-container p-4 sm:col-span-2"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Assigned ceremonies</p><span className="text-xs font-semibold text-primary">{ceremonyNames.length}</span></div><div className="mt-3 flex flex-wrap gap-2">{ceremonyNames.map((name) => <span key={name} className="rounded-full border border-outline-variant/70 bg-white px-3 py-1.5 text-xs font-medium text-on-surface shadow-sm">{name}</span>)}</div></div></div>;
}

function latestCampaignTitle(campaign: SerializedCampaign) {
  if (campaign.status === "DRAFT") return "Invitation campaign ready to start";
  if (campaign.status === "SENDING") return "Invitation campaign in progress";
  if (campaign.status === "COMPLETED") return "Latest campaign completed";
  if (campaign.status === "PARTIAL") return "Latest campaign completed with some failures";
  return "Latest campaign needs attention";
}

function ReviewMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-surface-container p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-lg font-semibold text-primary">{value}</p></div>; }

function RevokeDialog({ item, pending, onClose, onConfirm }: { item: InvitationHubItem; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  return <DialogFrame title="Revoke invitation access?" tone="danger" onClose={onClose} actions={<><button type="button" disabled={pending} onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant">Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-error px-5 text-sm font-semibold text-on-error disabled:opacity-60">{pending ? <><LoadingSpinner className="h-4 w-4" />Revoking…</> : <><UiIcon name="link-off" className="h-4 w-4" />Revoke access</>}</button></>}><p className="text-sm leading-6 text-on-surface-variant">The personalized invitation link sent to <strong className="text-on-surface">{item.displayName.en}</strong> will stop working immediately.</p><div className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">Their guest profile, assigned ceremonies and invitation history will remain safely preserved.</div></DialogFrame>;
}

function RestoreDialog({ item, pending, onClose, onConfirm }: { item: InvitationHubItem; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  return <DialogFrame title="Restore invitation access?" onClose={onClose} actions={<><button type="button" disabled={pending} onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant">Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60">{pending ? <><LoadingSpinner className="h-4 w-4" />Restoring…</> : <><UiIcon name="refresh" className="h-4 w-4" />Restore invitation</>}</button></>}><p className="text-sm leading-6 text-on-surface-variant">Restore invitation access for <strong className="text-on-surface">{item.displayName.en}</strong>?</p><div className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">Vivaahly will create a new private invitation link. The revoked link stays invalid, delivery history remains preserved, and the invitation returns to ready-to-send status.</div></DialogFrame>;
}

function EmailDialog({ item, email, setEmail, onValidate, error, pending, onClose, onSave }: { item: InvitationHubItem; email: string; setEmail: (value: string) => void; onValidate: (value: string) => void; error: string | null; pending: boolean; onClose: () => void; onSave: (send: boolean) => void }) {
  return <DialogFrame title="Email required for delivery" onClose={onClose} actions={<><button type="button" disabled={pending} onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant">Cancel</button><button type="button" disabled={pending} onClick={() => onSave(false)} className="min-h-10 rounded-xl bg-surface-container px-4 text-sm font-semibold text-on-surface disabled:opacity-50">Save email only</button><button type="button" disabled={pending} onClick={() => onSave(true)} className="min-h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">Save & send invitation</button></>}><p className="text-sm leading-6 text-on-surface-variant">Enter the primary email address for <strong className="text-on-surface">{item.displayName.en}</strong>.</p><label htmlFor="invitee-email" className="mt-5 block text-sm font-semibold text-on-surface">Primary invitee email</label><input id="invitee-email" type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} onBlur={(event) => onValidate(event.target.value)} maxLength={254} aria-invalid={Boolean(error)} aria-describedby={error ? "invitee-email-error" : undefined} placeholder="name@example.com" className={`mt-2 min-h-11 w-full rounded-xl border bg-surface-container-low px-3 text-sm font-normal outline-none ${error ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"}`} />{error ? <p id="invitee-email-error" role="alert" className="mt-2 flex items-center gap-2 text-sm font-medium text-error"><UiIcon name="warning" className="h-4 w-4" />{error}</p> : null}{item.primaryContact.phone ? <p className="mt-2 text-xs text-on-surface-variant">Phone on file: {item.primaryContact.phone}</p> : null}</DialogFrame>;
}
