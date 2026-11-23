"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UiIcon } from "@/components/ui-icon";
import type {
  EmailCampaignRecipientStatus,
  EmailCampaignStatus,
} from "@/modules/guest-invitations/guest-invitation.types";
import { RequestTimeoutError, fetchWithTimeout } from "@/shared/http/fetch-with-timeout";

export type CampaignDto = {
  id: string;
  status: EmailCampaignStatus;
  totalRecipients: number;
  pending: number;
  sent: number;
  failed: number;
  createdByMembershipId: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipientDto = {
  id: string;
  guestName: string;
  emailSnapshot: string;
  status: EmailCampaignRecipientStatus;
  attemptCount: number;
  lastErrorMessage: string | null;
  sentAt: string | null;
};

type Props = {
  initialCampaign: CampaignDto;
  initialRecipients: RecipientDto[];
  initialRecipientTotal: number;
  initialRecipientPage: number;
  recipientPageSize: number;
  autoStart: boolean;
};

type ApiResponse = {
  data?: {
    campaign?: CampaignDto;
    recipients?: RecipientDto[];
    total?: number;
  };
  error?: { message?: string };
};

export function CampaignProgress({
  initialCampaign,
  initialRecipients,
  initialRecipientTotal,
  initialRecipientPage,
  recipientPageSize,
  autoStart,
}: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [recipientTotal, setRecipientTotal] = useState(initialRecipientTotal);
  const [recipientPage, setRecipientPage] = useState(initialRecipientPage);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const refreshRecipients = useCallback(async () => {
    const response = await fetchWithTimeout(
      `/api/v1/email-campaigns/${campaign.id}/recipients?page=${recipientPage}&pageSize=${recipientPageSize}`,
      { method: "GET" },
      15_000,
    );
    const payload = (await response.json()) as ApiResponse;
    if (response.ok && payload.data?.recipients) {
      setRecipients(payload.data.recipients);
      if (typeof payload.data.total === "number") setRecipientTotal(payload.data.total);
    }
  }, [campaign.id, recipientPage, recipientPageSize]);

  const openRecipientPage = useCallback(async (page: number) => {
    if (page === recipientPage || recipientsLoading) return;
    setRecipientsLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/email-campaigns/${campaign.id}/recipients?page=${page}&pageSize=${recipientPageSize}`,
        { method: "GET" },
        15_000,
      );
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.data?.recipients) {
        throw new Error(payload.error?.message ?? "Campaign recipients could not be loaded.");
      }
      setRecipients(payload.data.recipients);
      if (typeof payload.data.total === "number") setRecipientTotal(payload.data.total);
      setRecipientPage(page);
      const url = new URL(window.location.href);
      url.searchParams.delete("start");
      if (page === 1) url.searchParams.delete("recipientPage");
      else url.searchParams.set("recipientPage", String(page));
      window.history.replaceState(window.history.state, "", url);
    } catch (caught) {
      setError(
        caught instanceof RequestTimeoutError
          ? "Campaign recipients are taking longer than expected to load. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Campaign recipients could not be loaded.",
      );
    } finally {
      setRecipientsLoading(false);
    }
  }, [campaign.id, recipientPage, recipientPageSize, recipientsLoading]);

  const sendPending = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      let current = campaign;
      while (current.pending > 0) {
        const response = await fetchWithTimeout(
          `/api/v1/email-campaigns/${campaign.id}/send-next`,
          { method: "POST" },
          30_000,
        );
        const payload = (await response.json()) as ApiResponse;
        if (!response.ok || !payload.data?.campaign) {
          throw new Error(payload.error?.message ?? "Invitation delivery was interrupted.");
        }
        current = payload.data.campaign;
        setCampaign(current);
        await refreshRecipients();
        if (current.pending > 0) await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
    } catch (caught) {
      setError(
        caught instanceof RequestTimeoutError
          ? "Delivery is taking longer than expected. Your progress is saved—continue when ready."
          : caught instanceof Error
            ? caught.message
            : "Invitation delivery was interrupted. Your progress is saved.",
      );
    } finally {
      setRunning(false);
    }
  }, [campaign, refreshRecipients, running]);

  useEffect(() => {
    if (!autoStart || autoStarted.current || !campaign.pending) return;
    autoStarted.current = true;
    void sendPending();
  }, [autoStart, campaign.pending, sendPending]);

  async function retryFailed() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/email-campaigns/${campaign.id}/retry-failed`,
        { method: "POST" },
        15_000,
      );
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.data?.campaign) {
        throw new Error(payload.error?.message ?? "Failed recipients could not be prepared for retry.");
      }
      router.push(`/app/invitations/campaigns/${payload.data.campaign.id}?start=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed recipients could not be retried.");
      setRunning(false);
    }
  }

  const completed = campaign.pending === 0;
  const progress = campaign.totalRecipients
    ? Math.round(((campaign.sent + campaign.failed) / campaign.totalRecipients) * 100)
    : 0;
  const recipientPageCount = Math.max(1, Math.ceil(recipientTotal / recipientPageSize));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link href="/app/invitations" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <UiIcon name="arrow-left" className="h-4 w-4" /> Back to guest invitations
          </Link>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">Invitation delivery</p>
          <h1 className="mt-1 font-headline-lg text-[2.25rem] leading-tight text-primary sm:text-[2.8rem]">
            {completed ? (campaign.failed ? "Delivery completed with issues" : "Delivery completed") : "Sending invitations"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {completed
              ? "Review the final result below. Successful invitations will not be sent again when failed recipients are retried."
              : "Progress is saved after every batch. You can leave this page and continue later without resending successful emails."}
          </p>
        </div>
        <Link href="/app/invitations/preview" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-primary hover:bg-surface-container-low">
          <UiIcon name="eye" className="h-4 w-4" /> Preview email
        </Link>
      </div>

      {error ? <div role="alert" className="mt-5 rounded-xl border border-error/25 bg-error-container p-4 text-sm text-on-error-container">{error}</div> : null}

      <section className="mt-6 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-on-surface">Overall delivery completion</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">{statusLabel(campaign.status)}</p>
          </div>
          <p className="text-sm font-semibold text-primary">{progress}% complete</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-outline-variant/50">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          <ProgressMetric label="Total recipients" value={campaign.totalRecipients} />
          <ProgressMetric label="Sent" value={campaign.sent} tone="success" />
          <ProgressMetric label="Remaining" value={campaign.pending} />
          <ProgressMetric label="Failed" value={campaign.failed} tone={campaign.failed ? "danger" : undefined} />
        </div>
      </section>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {!completed ? <button type="button" disabled={running} onClick={() => void sendPending()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-md disabled:opacity-60">{running ? <><LoadingSpinner className="h-4 w-4" /> Sending safely…</> : <><UiIcon name="send" className="h-4 w-4" /> {campaign.status === "DRAFT" ? "Start delivery" : "Continue delivery"}</>}</button> : null}
        {completed && campaign.failed ? <button type="button" disabled={running} onClick={() => void retryFailed()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-md disabled:opacity-60">{running ? <><LoadingSpinner className="h-4 w-4" /> Retrying…</> : <><UiIcon name="refresh" className="h-4 w-4" /> Retry failed recipients</>}</button> : null}
        {completed ? <Link href="/app/invitations" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold ${campaign.failed ? "border border-outline-variant bg-white text-primary" : "bg-primary text-on-primary shadow-md"}`}><UiIcon name={campaign.failed ? "arrow-left" : "check-circle"} className="h-4 w-4" /> Return to invitations</Link> : null}
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-outline-variant/60 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/60 px-5 py-4 sm:px-6">
          <div><h2 className="font-headline-lg text-2xl font-semibold text-primary">Recipients</h2><p className="text-xs text-on-surface-variant">The email address is captured when this campaign is prepared.</p></div>
          {running || recipientsLoading ? <LoadingSpinner className="h-5 w-5 text-primary" /> : null}
        </div>
        <div className="divide-y divide-outline-variant/50" aria-busy={recipientsLoading}>
          {recipientsLoading
            ? Array.from({ length: 5 }, (_, index) => <RecipientRowSkeleton key={index} />)
            : recipients.map((recipient) => <RecipientRow key={recipient.id} recipient={recipient} />)}
        </div>
        <CampaignRecipientPagination
          page={recipientPage}
          pageCount={recipientPageCount}
          pageSize={recipientPageSize}
          total={recipientTotal}
          loading={recipientsLoading}
          onPage={(page) => void openRecipientPage(page)}
        />
      </section>
    </main>
  );
}

function ProgressMetric({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-outline">{label}</p><p className={`mt-1 text-xl font-semibold leading-none ${tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-error" : "text-on-surface"}`}>{value}</p></div>;
}

function RecipientRow({ recipient }: { recipient: RecipientDto }) {
  return <article className="grid gap-2 px-5 py-3.5 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] sm:items-center sm:px-6"><div><h3 className="text-sm font-semibold text-on-surface">{recipient.guestName}</h3><p className="mt-0.5 truncate text-xs text-on-surface-variant">{recipient.emailSnapshot}</p></div><div className="text-xs text-on-surface-variant">{recipient.status === "FAILED" ? recipient.lastErrorMessage ?? "Delivery failed" : recipient.sentAt ? `Sent ${formatDate(recipient.sentAt)}` : "Ready to send"}</div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${recipient.status === "SENT" ? "bg-emerald-50 text-emerald-800" : recipient.status === "FAILED" ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-on-surface-variant"}`}>{recipient.status.toLowerCase()}</span></article>;
}

function RecipientRowSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 px-5 py-4 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] sm:items-center sm:px-6">
      <div><div className="h-4 w-40 rounded bg-surface-container-high" /><div className="mt-2 h-3 w-52 rounded bg-surface-container" /></div>
      <div className="h-3 w-48 rounded bg-surface-container" />
      <div className="h-6 w-16 rounded-full bg-surface-container-high" />
    </div>
  );
}

function CampaignRecipientPagination({
  page,
  pageCount,
  pageSize,
  total,
  loading,
  onPage,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((value) => value >= 1 && value <= pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant/60 bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-on-surface-variant" aria-live="polite">
        Showing {first}–{last} of {total} recipients · Page {page} of {pageCount}
      </p>
      {pageCount > 1 ? (
        <nav aria-label="Campaign recipient pages" className="flex items-center gap-1">
          <button type="button" disabled={loading || page === 1} onClick={() => onPage(page - 1)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-40">Previous</button>
          {pages.map((value, index) => (
            <span key={value} className="contents">
              {index > 0 && value - pages[index - 1] > 1 ? <span className="px-1 text-outline">…</span> : null}
              <button type="button" disabled={loading} aria-current={value === page ? "page" : undefined} onClick={() => onPage(value)} className={`h-9 min-w-9 rounded-lg text-xs font-semibold disabled:opacity-40 ${value === page ? "bg-primary text-on-primary" : "bg-white text-on-surface"}`}>{value}</button>
            </span>
          ))}
          <button type="button" disabled={loading || page === pageCount} onClick={() => onPage(page + 1)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-40">Next</button>
        </nav>
      ) : null}
    </div>
  );
}

function statusLabel(status: EmailCampaignStatus) {
  return ({ DRAFT: "Ready", SENDING: "In progress", PARTIAL: "Completed with failures", COMPLETED: "Completed", FAILED: "Failed" } as const)[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
