"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { UiIcon, type UiIconName } from "@/components/ui-icon";
import { acceptOrganizerInvitationSchema } from "@/modules/organizers/organizer.schemas";
import type { OrganizerInvitationAccessDto } from "@/modules/organizers/organizer.types";
import { ORGANIZER_PASSWORD_MAX_LENGTH, ORGANIZER_PASSWORD_MIN_LENGTH } from "@/modules/auth/password-policy";
import { fetchWithTimeout, RequestTimeoutError } from "@/shared/http/fetch-with-timeout";

type ErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: { reason?: string; fieldErrors?: Record<string, string[]> };
  };
};

type AcceptanceResponse = {
  data: {
    user: { id: string; name: string; email: string };
    membership: { role: "ADMIN" | "MANAGER" };
  };
};

function formatWeddingDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function initials(value?: string) {
  return value?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "V";
}

export function OrganizerInvitationAcceptance({ token, initialAccess }: { token: string; initialAccess: OrganizerInvitationAccessDto }) {
  const router = useRouter();
  const [access, setAccess] = useState(initialAccess);
  const [accepted, setAccepted] = useState(false);
  const [acceptedOrganizer, setAcceptedOrganizer] = useState<AcceptanceResponse["data"]["user"] | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const invitation = access.invitation;
  const returnTo = `/join/${encodeURIComponent(token)}`;

  async function accept(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setFieldErrors({});
    const payload = event
      ? { name: String(new FormData(event.currentTarget).get("name") ?? ""), password: String(new FormData(event.currentTarget).get("password") ?? "") }
      : {};
    const parsed = acceptOrganizerInvitationSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setPending(true);
    try {
      const response = await fetchWithTimeout(
        `/api/v1/organizer-invitations/access/${encodeURIComponent(token)}/accept`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) },
      );
      if (!response.ok) {
        const result = (await response.json()) as ErrorResponse;
        setFieldErrors(result.error?.details?.fieldErrors ?? {});
        const reason = result.error?.details?.reason;
        if (reason === "ACTIVE_MEMBERSHIP") {
          setAccess((current) => ({ ...current, state: "ACTIVE_MEMBERSHIP_CONFLICT" }));
          return;
        }
        if (reason === "ACCOUNT_MISMATCH") {
          setAccess((current) => ({ ...current, state: "WRONG_ACCOUNT" }));
          return;
        }
        if (reason === "SIGN_IN_REQUIRED") {
          setAccess((current) => ({ ...current, state: "SIGN_IN_REQUIRED" }));
          return;
        }
        if (reason === "INVITATION_UNAVAILABLE") {
          setAccess({ state: "UNAVAILABLE", invitation: null });
          return;
        }
        if (Object.keys(result.error?.details?.fieldErrors ?? {}).length) return;
        setError(result.error?.message ?? "We couldn’t complete that right now.");
        return;
      }
      const result = (await response.json()) as AcceptanceResponse;
      setAcceptedOrganizer(result.data.user);
      // Keep the confirmation state on screen. Refreshing this consumed bearer
      // URL would correctly resolve it as unavailable and hide the success UI.
      setAccepted(true);
    } catch (requestError) {
      setError(requestError instanceof RequestTimeoutError ? "The request took too long. Please try again." : "Unable to connect to Vivaahly. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function signOutAndContinue() {
    setPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-on-surface antialiased">
      <header className="border-b border-outline-variant/60 bg-surface/95 px-margin-mobile py-4 backdrop-blur md:px-margin">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="Vivaahly home" className="font-headline-lg text-[1.65rem] font-semibold leading-none text-primary no-underline">Vivaahly</Link>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Organizer invitation</span>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-7 md:px-margin md:py-10">
        <div className="mx-auto max-w-6xl">
          {error ? (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl bg-error-container p-4 text-on-error-container">
              <UiIcon name="cloud-off" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <div className="min-w-0 flex-1"><p className="text-body-md font-semibold text-error">Connection interrupted</p><p className="mt-0.5 text-body-sm">{error}</p></div>
              <button type="button" onClick={() => setError(null)} className="rounded-lg p-1 hover:bg-error/10" aria-label="Dismiss error"><UiIcon name="close" className="h-4 w-4" /></button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            {invitation ? (
              <section className="flex min-w-0 flex-col gap-5 lg:col-span-5">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-3 py-1 text-label-sm font-semibold uppercase tracking-wider text-on-secondary-fixed shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />You’re invited</span>
                  <h1 className="mt-3 font-headline-lg text-headline-lg-mobile font-normal leading-tight tracking-tight text-primary md:text-headline-lg">Help plan {invitation.coupleName}’s wedding</h1>
                  <p className="mt-2 text-body-md leading-7 text-on-surface-variant md:text-body-lg">{invitation.inviterName} has invited you to join their private Vivaahly wedding workspace.</p>
                </div>

                <div className="relative hidden h-32 overflow-hidden rounded-xl bg-surface-container shadow-sm md:block lg:h-auto lg:aspect-[16/7]">
                  <Image src="/brand/wedding-celebration.jpg" alt="Family and friends celebrating at an Indian wedding" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" priority />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary/90 via-primary/25 to-transparent p-4 text-on-primary">
                    <div>
                      <span className="text-label-sm font-semibold uppercase tracking-widest text-primary-fixed-dim">Private workspace</span>
                      <p className="mt-1 font-headline-lg text-[1.65rem] font-medium leading-none text-white md:text-[1.85rem]">{invitation.coupleName}</p>
                      <p className="mt-1 font-headline-lg text-title-md italic text-primary-fixed-dim">“{invitation.weddingTitle}”</p>
                    </div>
                  </div>
                </div>

                <InvitationSummary invitation={invitation} />
                <div className="hidden lg:block"><RoleExplanation role={invitation.role} /></div>
              </section>
            ) : null}

            <section className={`flex flex-col gap-6 ${invitation ? "lg:col-span-7" : "lg:col-span-8 lg:col-start-3"}`}>
              <div className="overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-[0_12px_32px_rgba(44,28,33,.09)] md:p-10">
                {accepted && invitation ? (
                  <AcceptedInvitationState invitation={invitation} organizer={acceptedOrganizer} />
                ) : access.state === "NEW_USER" && invitation ? (
                  <div className="space-y-6">
                    <div><p className="text-label-sm font-semibold uppercase tracking-wider text-secondary">Step 1 of 1</p><h2 className="mt-1 font-headline-md text-headline-md text-on-surface">Create your account to join</h2><p className="mt-1.5 text-body-md text-on-surface-variant">Set up your private organizer account. It only takes a moment.</p></div>
                    <form onSubmit={accept} className="space-y-5" noValidate>
                      <Field label="Your full name" name="name" type="text" autoComplete="name" disabled={pending} error={fieldErrors.name?.[0]} placeholder="Your name" onInput={() => setFieldErrors((current) => ({ ...current, name: [] }))} />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3"><p className="text-label-md font-semibold">Invitation email</p><span className="flex shrink-0 items-center gap-1 text-label-sm text-on-surface-variant"><UiIcon name="lock" className="h-3.5 w-3.5" strokeWidth={2} />Locked</span></div>
                        <div className="relative flex min-h-12 items-center rounded-lg bg-surface-container-high py-3 pl-14 pr-4 text-body-md text-on-surface-variant shadow-inner"><span className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-surface-container-lowest text-primary"><UiIcon name="mail-lock" className="h-5 w-5" strokeWidth={2} /></span><span className="break-all">{invitation.invitedEmailMasked}</span></div>
                        <p className="text-body-sm text-on-surface-variant/80">This invitation is connected to this email address and cannot be changed.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="join-password" className="text-label-md font-semibold">Create a password</label>
                        <div className="relative"><input id="join-password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" disabled={pending} minLength={ORGANIZER_PASSWORD_MIN_LENGTH} maxLength={ORGANIZER_PASSWORD_MAX_LENGTH} onInput={() => setFieldErrors((current) => ({ ...current, password: [] }))} aria-invalid={Boolean(fieldErrors.password?.[0])} placeholder="Enter a secure password" className={`w-full rounded-lg bg-surface-container-lowest px-4 py-3 pr-12 text-body-md shadow-sm outline-none transition-all focus:bg-surface-bright focus:ring-2 ${fieldErrors.password?.[0] ? "ring-2 ring-error focus:ring-error" : "focus:ring-primary/20"}`} /><button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant transition-colors hover:text-on-surface" aria-label={passwordVisible ? "Hide password" : "Show password"}><UiIcon name={passwordVisible ? "eye-off" : "eye"} className="h-5 w-5" /></button></div>
                        {fieldErrors.password?.[0] ? <p role="alert" className="flex items-center gap-1 text-body-sm text-error"><UiIcon name="warning" className="h-4 w-4" />{fieldErrors.password[0]}</p> : null}
                        <p className="text-body-sm text-on-surface-variant/80">Use at least 12 characters. A memorable passphrase works well; use single spaces between words.</p>
                      </div>
                      <button disabled={pending} className={primaryButton}>{pending ? "Creating account…" : "Create account & join wedding"}<UiIcon name="arrow-right" className="h-5 w-5" /></button>
                    </form>
                    <div className="-mx-6 -mb-6 md:-mx-10 md:-mb-10"><div className="bg-surface-container-low p-6 text-center md:p-8"><p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Already have a Vivaahly account?</p><Link className="mt-2 inline-flex items-center gap-1 text-title-md font-semibold text-primary transition-colors hover:text-primary-container" href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Already have an account? Sign in <UiIcon name="arrow-right" className="h-4 w-4" /></Link></div><div aria-hidden="true" className="h-5 bg-surface-container-lowest md:h-7" /></div>
                  </div>
                ) : access.state === "SIGN_IN_REQUIRED" && invitation ? (
                  <InvitationState icon="mail-lock" eyebrow="Existing account" title="Sign in to accept" body="This invitation email already has a Vivaahly account. Sign in with that account to continue."><Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className={primaryButton}>Sign in to continue <UiIcon name="arrow-right" className="h-5 w-5" /></Link><Link href="/" className={secondaryButton}>Back to Vivaahly</Link></InvitationState>
                ) : access.state === "READY" && invitation ? (
                  <InvitationState icon="user-check" title="Ready to join the wedding team?" body={`You are accepting this invitation for ${invitation.coupleName}’s wedding.`}>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container p-4 text-left shadow-sm"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-bold text-on-primary-fixed">{initials(invitation.signedInName)}</span><div className="min-w-0"><p className="truncate text-title-md font-semibold">{invitation.signedInName ?? invitation.signedInEmail}</p><p className="truncate text-body-sm text-on-surface-variant">{invitation.signedInEmail}</p><p className="mt-1 text-body-sm font-medium text-primary">Role: {roleName(invitation.role)}</p></div></div><span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-medium text-on-primary-fixed">Active</span></div>
                    <button type="button" disabled={pending} onClick={() => accept()} className={primaryButton}>{pending ? "Joining…" : "Accept invitation & join workspace"}<UiIcon name="check-circle" className="h-5 w-5" /></button>
                    <button type="button" disabled={pending} onClick={signOutAndContinue} className={secondaryButton}><UiIcon name="log-out" className="h-4 w-4" />Not your account? Sign out</button>
                  </InvitationState>
                ) : access.state === "WRONG_ACCOUNT" && invitation ? (
                  <InvitationState icon="account-off" eyebrow="Account mismatch" title="This invitation is connected to another email" body="You’re currently signed in using a different email. Sign out and continue using the email address that received this invitation." tone="error">
                    <div className="space-y-2"><AccountRow label="Currently signed in" value={invitation.signedInEmail ?? "Another account"} /><AccountRow label="Invitation sent to" value={invitation.invitedEmailMasked} emphasize /></div>
                    <button type="button" disabled={pending} onClick={signOutAndContinue} className={primaryButton}><UiIcon name="log-out" className="h-5 w-5" />{pending ? "Signing out…" : "Sign out and continue"}</button>
                    <p className="text-center text-body-sm text-on-surface-variant/80">You’ll return to this invitation after signing out.</p><Link href="/" className={secondaryButton}>Back to Vivaahly</Link>
                  </InvitationState>
                ) : access.state === "ACTIVE_MEMBERSHIP_CONFLICT" ? (
                  <InvitationState icon="workspace-off" eyebrow="Active workspace limit" title="You already belong to another wedding workspace" body="Vivaahly currently supports one active wedding workspace per organizer account. This invitation cannot be accepted using your current account." tone="warning"><p className="rounded-xl bg-surface-container p-4 text-body-sm leading-6 text-on-surface-variant">To join this wedding using another email, ask the wedding Admin to revoke this invitation and send a new invitation to that address.</p><Link href="/app" className={primaryButton}>Return to your current workspace <UiIcon name="arrow-right" className="h-5 w-5" /></Link><Link href="/" className={secondaryButton}>Back to Vivaahly</Link></InvitationState>
                ) : (
                  <InvitationState icon="link-off" eyebrow="Invitation status" title="This invitation is no longer available" body="The invitation may have expired, been revoked, or already been used. Please ask the wedding Admin to send you a new invitation." centered><Link href="/" className={primaryButton}>Back to Vivaahly</Link></InvitationState>
                )}
              </div>
              {invitation ? <div className="lg:hidden"><RoleExplanation role={invitation.role} /></div> : null}
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-outline-variant/60 bg-surface-container-lowest px-margin-mobile py-5 text-center text-body-sm text-on-surface-variant md:px-margin">© {new Date().getFullYear()} Vivaahly. All rights reserved.</footer>
    </div>
  );
}

function AcceptedInvitationState({ invitation, organizer }: {
  invitation: NonNullable<OrganizerInvitationAccessDto["invitation"]>;
  organizer: AcceptanceResponse["data"]["user"] | null;
}) {
  const role = roleName(invitation.role);
  const accountEmail = organizer?.email ?? invitation.signedInEmail ?? invitation.invitedEmailMasked;

  return (
    <div className="space-y-6 py-4 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed text-secondary shadow-sm">
        <UiIcon name="heart" className="h-8 w-8" fill="currentColor" strokeWidth={1.5} />
      </span>
      <div>
        <span className="inline-flex rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold uppercase tracking-wider text-on-primary-fixed">Invitation confirmed</span>
        <h2 className="mt-2 font-headline-lg text-headline-lg font-normal leading-tight text-primary">Welcome to the wedding team</h2>
        <p className="mx-auto mt-2 max-w-md text-body-lg leading-7 text-on-surface-variant">You’ve joined {invitation.coupleName}’s wedding workspace as a {role}.</p>
      </div>
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-surface-container-low p-5 text-left shadow-sm">
        <SuccessSummaryRow label="Wedding" value={invitation.coupleName} />
        <div className="flex items-center justify-between gap-4 text-body-sm"><span className="text-on-surface-variant">Assigned role:</span><span className="rounded-full bg-secondary-fixed px-2.5 py-1 text-label-sm font-bold text-on-secondary-fixed">{role}</span></div>
        <SuccessSummaryRow label="Account" value={accountEmail} />
      </div>
      <div className="pt-4">
        <Link href="/app" className={`${primaryButton} mx-auto max-w-md shadow-md`}>Open wedding workspace <UiIcon name="dashboard" className="h-5 w-5" /></Link>
      </div>
    </div>
  );
}

function SuccessSummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col justify-between gap-1 text-body-sm sm:flex-row sm:items-center"><span className="text-on-surface-variant">{label}:</span><span className="break-all font-semibold text-on-surface">{value}</span></div>;
}

function roleName(role: "ADMIN" | "MANAGER") {
  return role === "ADMIN" ? "Admin" : "Manager";
}

function InvitationSummary({ invitation }: { invitation: NonNullable<OrganizerInvitationAccessDto["invitation"]> }) {
  const role = roleName(invitation.role);
  return (
    <div className="flex flex-col gap-3.5 rounded-xl bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 pb-2"><span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Invitation summary</span><span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm text-on-surface-variant"><UiIcon name="lock" className="h-3.5 w-3.5" />Private team</span></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><SummaryItem icon="calendar" label="Wedding date" value={formatWeddingDate(invitation.weddingDate)} /><SummaryItem icon="map-pin" label="Wedding location" value={invitation.weddingLocation} /></div>
      <div className="border-t border-outline-variant/30 pt-3"><SummaryItem icon="badge" label="Assigned role" value={`Role: ${role} — ${invitation.role === "ADMIN" ? "Coordinate planning and manage organizers." : "Help coordinate wedding planning with the family."}`} badge={`${role} tier`} /></div>
      <SummaryItem icon="clock" label="Invitation validity" value={`Invitation expires ${formatExpiry(invitation.expiresAt)}`} mutedIcon />
    </div>
  );
}

function SummaryItem({ icon, label, value, badge, mutedIcon = false }: { icon: UiIconName; label: string; value: string; badge?: string; mutedIcon?: boolean }) {
  return <div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container ${mutedIcon ? "text-on-surface-variant" : "text-primary"}`}><UiIcon name={icon} className="h-4 w-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-label-sm text-on-surface-variant">{label}</p>{badge ? <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm font-semibold text-on-secondary-fixed">{badge}</span> : null}</div><p className="mt-0.5 text-body-sm font-medium text-on-surface sm:text-title-md">{value}</p></div></div>;
}

function RoleExplanation({ role }: { role: "ADMIN" | "MANAGER" }) {
  const name = roleName(role);
  return <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-sm"><span className="absolute inset-y-0 left-0 w-1 bg-primary" /><div className="pl-2"><div className="flex items-center justify-between gap-3"><h3 className="font-headline-sm text-headline-sm text-primary">What does {role === "ADMIN" ? "an" : "a"} {name} do?</h3><UiIcon name="tune" className="h-5 w-5 text-primary" /></div><p className="mt-2 text-body-sm leading-6 text-on-surface-variant">{role === "ADMIN" ? "You’ll be able to coordinate wedding planning and invite or manage other organizers." : "You’ll be able to help with events, guest lists, RSVPs, timeline checklists, vendors, expenses, and day-to-day coordination."}</p><p className="mt-2 text-body-sm italic text-on-surface-variant/80">Your role is assigned by the wedding Admin so private celebration details stay coordinated smoothly.</p></div></div>;
}

const primaryButton = "flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3.5 text-center text-title-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-surface-container px-5 py-2.5 text-center text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high";

function InvitationState({ icon, eyebrow, title, body, children, centered = false, tone = "default" }: { icon: UiIconName; eyebrow?: string; title: string; body: string; children: ReactNode; centered?: boolean; tone?: "default" | "error" | "warning" }) {
  const iconTone = tone === "error" ? "bg-error-container text-error" : tone === "warning" ? "bg-tertiary-fixed text-on-tertiary-fixed" : centered ? "bg-surface-container-highest text-on-surface-variant" : "bg-secondary-fixed text-secondary";
  const eyebrowTone = tone === "error" ? "bg-error-container text-error" : tone === "warning" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-primary-fixed text-on-primary-fixed";
  return <div className={centered ? "space-y-6 py-6 text-center" : "space-y-6"}><span className={`flex items-center justify-center shadow-sm ${centered ? "mx-auto h-16 w-16 rounded-full" : "h-12 w-12 rounded-xl"} ${iconTone}`}><UiIcon name={icon} className={centered ? "h-8 w-8" : "h-6 w-6"} /></span><div>{eyebrow ? <span className={`inline-flex rounded-full px-2.5 py-1 text-label-sm font-semibold uppercase tracking-wider ${eyebrowTone}`}>{eyebrow}</span> : null}<h2 className={`${eyebrow ? "mt-2" : ""} font-headline-md text-headline-md text-on-surface`}>{title}</h2><p className={`mt-2 text-body-md leading-7 text-on-surface-variant ${centered ? "mx-auto max-w-md" : ""}`}>{body}</p></div><div className={`space-y-3 ${centered ? "mx-auto max-w-sm pt-1" : "pt-2"}`}>{children}</div></div>;
}

function AccountRow({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return <div className="flex flex-col justify-between gap-1 rounded-lg bg-surface-container p-3.5 text-body-sm sm:flex-row sm:items-center"><span className="text-on-surface-variant">{label}:</span><span className={`break-all font-semibold ${emphasize ? "font-mono text-primary" : "text-on-surface"}`}>{value}</span></div>;
}

function Field({ label, name, type, autoComplete, disabled, error, placeholder, onInput }: { label: string; name: string; type: "text"; autoComplete: string; disabled: boolean; error?: string; placeholder?: string; onInput: () => void }) {
  return <div className="space-y-1.5"><label htmlFor={`join-${name}`} className="text-label-md font-semibold">{label}</label><input id={`join-${name}`} name={name} type={type} autoComplete={autoComplete} disabled={disabled} onInput={onInput} aria-invalid={Boolean(error)} placeholder={placeholder} className={`w-full rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md shadow-sm outline-none transition-all focus:bg-surface-bright focus:ring-2 ${error ? "ring-2 ring-error focus:ring-error" : "focus:ring-primary/20"}`} />{error ? <p role="alert" className="flex items-center gap-1 text-body-sm text-error"><UiIcon name="warning" className="h-4 w-4" />{error}</p> : null}</div>;
}
