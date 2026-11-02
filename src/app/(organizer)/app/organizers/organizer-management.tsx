"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { UiIcon, type UiIconName } from "@/components/ui-icon";
import { createOrganizerInvitationSchema } from "@/modules/organizers/organizer.schemas";
import { fetchWithTimeout, RequestTimeoutError } from "@/shared/http/fetch-with-timeout";

type Member = { id: string; userId: string; name: string; email: string; role: "ADMIN" | "MANAGER"; joinedAt: string };
type Invitation = { id: string; email: string; role: "ADMIN" | "MANAGER"; status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED"; expiresAt: string | null; createdAt: string };
type ApiError = { error?: { code?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } } };
type MemberAction = { memberId: string; type: "role" | "remove"; nextRole?: "ADMIN" | "MANAGER" };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function daysRemaining(value: string | null) {
  if (!value) return "Expiring soon";
  const days = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
  return days === 1 ? "Expires in 1 day" : `Expires in ${days} days`;
}

export function OrganizerManagement({ currentUserId, canManage, members, invitations }: { currentUserId: string; canManage: boolean; members: Member[]; invitations: Invitation[] }) {
  const router = useRouter();
  const inviteDialogRef = useRef<HTMLDialogElement>(null);
  const inviteFormRef = useRef<HTMLFormElement>(null);
  const revokeDialogRef = useRef<HTMLDialogElement>(null);
  const memberDialogRef = useRef<HTMLDialogElement>(null);
  const lastReconciliationAtRef = useRef(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [recentlyResentId, setRecentlyResentId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmMemberAction, setConfirmMemberAction] = useState<MemberAction | null>(null);
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const invitationToRevoke = invitations.find((invitation) => invitation.id === confirmRevokeId);
  const memberToManage = members.find((member) => member.id === confirmMemberAction?.memberId);

  const refreshAuthoritativeState = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastReconciliationAtRef.current < 500) return;
    lastReconciliationAtRef.current = now;
    router.refresh();
  }, [router]);

  useEffect(() => {
    const dialog = inviteDialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  useEffect(() => {
    const dialog = revokeDialogRef.current;
    if (!dialog) return;
    if (confirmRevokeId && !dialog.open) dialog.showModal();
    if (!confirmRevokeId && dialog.open) dialog.close();
  }, [confirmRevokeId]);

  useEffect(() => {
    const dialog = memberDialogRef.current;
    if (!dialog) return;
    if (confirmMemberAction && !dialog.open) dialog.showModal();
    if (!confirmMemberAction && dialog.open) dialog.close();
  }, [confirmMemberAction]);

  useEffect(() => {
    function reconcileOnFocus() {
      refreshAuthoritativeState();
    }

    function reconcileOnVisibilityChange() {
      if (document.visibilityState === "visible") refreshAuthoritativeState();
    }

    window.addEventListener("focus", reconcileOnFocus);
    document.addEventListener("visibilitychange", reconcileOnVisibilityChange);
    return () => {
      window.removeEventListener("focus", reconcileOnFocus);
      document.removeEventListener("visibilitychange", reconcileOnVisibilityChange);
    };
  }, [refreshAuthoritativeState]);

  useEffect(() => {
    if (!openMemberMenuId) return;

    function closeMenuOnOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-member-menu]")) {
        setOpenMemberMenuId(null);
      }
    }

    function closeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMemberMenuId(null);
    }

    document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openMemberMenuId]);

  useEffect(() => {
    if (canManage) return;
    const timer = window.setTimeout(() => {
      setDialogOpen(false);
      setConfirmRevokeId(null);
      setConfirmMemberAction(null);
      setOpenMemberMenuId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canManage]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 7000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!recentlyResentId) return;
    const timer = window.setTimeout(() => setRecentlyResentId(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [recentlyResentId]);

  function resetInvitationForm() {
    inviteFormRef.current?.reset();
    setFieldErrors({});
  }

  function closeDialog() {
    if (pending) return;
    setError(null);
    resetInvitationForm();
    setDialogOpen(false);
  }

  async function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React's SyntheticEvent currentTarget is only reliable while the event
    // handler is running synchronously. Keep the form reference before the
    // request so a successful 201 response cannot fall into the network-error
    // branch while trying to reset the form.
    const invitationForm = event.currentTarget;
    setError(null);
    setFieldErrors({});
    const form = new FormData(invitationForm);
    const parsed = createOrganizerInvitationSchema.safeParse({ email: form.get("email"), role: form.get("role") });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setPending(true);
    try {
      const response = await fetchWithTimeout("/api/v1/organizer-invitations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setFieldErrors(result.error?.details?.fieldErrors ?? {});
        if (result.error?.code === "EXTERNAL_SERVICE_ERROR") {
          setDialogOpen(false);
          setError(result.error.message ?? "The invitation was saved, but email delivery could not be confirmed.");
          refreshAuthoritativeState(true);
          return;
        }
        setError(result.error?.message ?? "Could not send this invitation.");
        if (response.status === 403) setDialogOpen(false);
        refreshAuthoritativeState(true);
        return;
      }
      invitationForm.reset();
      setDialogOpen(false);
      setMessage("Invitation sent successfully. They have seven days to accept.");
      refreshAuthoritativeState(true);
    } catch (requestError) {
      setError(requestError instanceof RequestTimeoutError
        ? "The invitation request took too long. Please check the pending list before trying again."
        : "Could not reach Vivaahly. Please try again.");
      refreshAuthoritativeState(true);
    } finally {
      setPending(false);
    }
  }

  async function invitationAction(id: string, action: "resend" | "revoke") {
    setActionId(id);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        action === "resend" ? `/api/v1/organizer-invitations/${id}/resend` : `/api/v1/organizer-invitations/${id}`,
        { method: action === "resend" ? "POST" : "DELETE" },
      );
      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setError(result.error?.message ?? `Could not ${action} this invitation.`);
        setConfirmRevokeId(null);
        refreshAuthoritativeState(true);
        return;
      }
      setConfirmRevokeId(null);
      if (action === "resend") setRecentlyResentId(id);
      setMessage(action === "resend" ? "A fresh invitation link was sent." : "Invitation revoked.");
      refreshAuthoritativeState(true);
    } catch {
      setError(`Could not ${action} this invitation. Please try again.`);
      setConfirmRevokeId(null);
      refreshAuthoritativeState(true);
    } finally {
      setActionId(null);
    }
  }

  async function manageMember(action: MemberAction) {
    setActionId(action.memberId);
    setError(null);
    try {
      const response = await fetchWithTimeout(`/api/v1/members/${action.memberId}`, {
        method: action.type === "remove" ? "DELETE" : "PATCH",
        ...(action.type === "role"
          ? {
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ role: action.nextRole }),
            }
          : {}),
      });
      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setError(result.error?.message ?? "Could not update this organizer.");
        setConfirmMemberAction(null);
        refreshAuthoritativeState(true);
        return;
      }
      setConfirmMemberAction(null);
      setMessage(
        action.type === "remove"
          ? "Organizer removed from this wedding."
          : `Organizer role changed to ${action.nextRole === "ADMIN" ? "Admin" : "Manager"}.`,
      );
      refreshAuthoritativeState(true);
    } catch (requestError) {
      setError(
        requestError instanceof RequestTimeoutError
          ? "The organizer update took too long. Please refresh before trying again."
          : "Could not update this organizer. Please try again.",
      );
      setConfirmMemberAction(null);
      refreshAuthoritativeState(true);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mt-7 space-y-6">
      {message ? (
        <div role="status" aria-live="polite" className="fixed inset-x-4 top-20 z-[70] mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50 p-4 text-emerald-950 shadow-xl">
          <UiIcon name="check-circle" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1"><p className="text-title-md font-semibold">Success</p><p className="mt-0.5 text-body-sm text-emerald-900">{message}</p></div>
          <button type="button" onClick={() => setMessage(null)} className="rounded-lg p-1 text-emerald-800 transition-colors hover:bg-emerald-100" aria-label="Dismiss message"><UiIcon name="close" className="h-5 w-5" /></button>
        </div>
      ) : null}

      {error && !dialogOpen ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container"><UiIcon name="warning" className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div>
      ) : null}

      <section className="w-full space-y-6 rounded-2xl bg-surface-container-lowest p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-surface-container-high/70 pb-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <UiIcon name="users" className="h-6 w-6 text-secondary" />
              <h2 className="text-[1.25rem] font-semibold text-on-surface">People helping with this wedding</h2>
              <span className="whitespace-nowrap rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-wider text-primary">{members.length} {members.length === 1 ? "organizer" : "organizers"}</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">These family members currently have access to the wedding workspace.</p>
          </div>
          {canManage ? (
            <button type="button" onClick={() => { setError(null); resetInvitationForm(); setDialogOpen(true); }} className="group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-title-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[.99] sm:w-auto"><UiIcon name="user-plus" className="h-5 w-5 transition-transform group-hover:scale-110" />Invite someone</button>
          ) : null}
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const accent = isCurrentUser ? "bg-primary" : member.role === "ADMIN" ? "bg-secondary" : "bg-outline-variant";
            const avatar = isCurrentUser ? "bg-primary text-on-primary" : member.role === "ADMIN" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-highest text-on-surface";
            return (
              <li key={member.id} className={`relative min-h-[148px] min-w-0 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container ${openMemberMenuId === member.id ? "z-20" : ""}`}>
                <span className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${accent}`} />
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-title-md font-semibold shadow-sm ${avatar}`}>{initials(member.name)}</span>
                  <div className={`min-w-0 flex-1 ${canManage && !isCurrentUser ? "pr-10" : ""}`}>
                    <div className="flex flex-wrap items-center gap-1.5"><p className="break-words text-title-md font-semibold text-on-surface">{member.name}</p>{isCurrentUser ? <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-on-primary-fixed">You</span> : null}<RoleBadge role={member.role} /></div>
                    <p className="mt-1 break-all text-body-sm text-on-surface-variant">{member.email}</p>
                    <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-on-surface-variant/80"><UiIcon name="calendar-check" className="h-[15px] w-[15px]" />Joined {formatDate(member.joinedAt)}</p>
                  </div>
                </div>
                {canManage && !isCurrentUser ? (
                  <div className="group/settings absolute right-3.5 top-3.5 z-20" data-member-menu>
                    <button
                      type="button"
                      disabled={actionId === member.id}
                      aria-label={`Organizer settings for ${member.name}`}
                      aria-describedby={`member-settings-tooltip-${member.id}`}
                      aria-haspopup="menu"
                      aria-expanded={openMemberMenuId === member.id}
                      aria-controls={`member-menu-${member.id}`}
                      onClick={() => setOpenMemberMenuId((current) => current === member.id ? null : member.id)}
                      className="group/gear flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-surface-container-lowest text-primary shadow-sm transition-all hover:bg-primary-fixed/30 focus-visible:bg-primary-fixed/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                    >
                      <UiIcon name="settings" className="h-5 w-5 transition-transform duration-200 group-hover/gear:rotate-[25deg] group-focus-visible/gear:rotate-[25deg]" />
                    </button>
                    {openMemberMenuId !== member.id ? (
                      <span id={`member-settings-tooltip-${member.id}`} role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-40 mb-1.5 hidden whitespace-nowrap rounded-lg bg-inverse-surface px-2.5 py-1 text-[12px] font-medium text-inverse-on-surface shadow-md group-hover/settings:block group-focus-within/settings:block">Organizer settings</span>
                    ) : null}
                    {openMemberMenuId === member.id ? (
                      <div id={`member-menu-${member.id}`} role="menu" aria-label={`Organizer options for ${member.name}`} className="absolute right-0 top-full z-30 mt-1.5 w-[210px] rounded-xl border border-primary/15 bg-surface-container-lowest p-1.5 text-left shadow-lg">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMemberMenuId(null);
                            setConfirmMemberAction({ memberId: member.id, type: "role", nextRole: member.role === "ADMIN" ? "MANAGER" : "ADMIN" });
                          }}
                          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-body-sm font-medium text-on-surface transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
                        >
                          <UiIcon name={member.role === "ADMIN" ? "manager" : "admin"} className={`h-[19px] w-[19px] ${member.role === "ADMIN" ? "text-secondary" : "text-primary"}`} />
                          Make {member.role === "ADMIN" ? "Manager" : "Admin"}
                        </button>
                        <div className="mx-2 my-1 border-t border-primary/10" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMemberMenuId(null);
                            setConfirmMemberAction({ memberId: member.id, type: "remove" });
                          }}
                          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-body-sm font-medium text-error transition-colors hover:bg-error/5 focus-visible:bg-error/5 focus-visible:outline-none"
                        >
                          <UiIcon name="account-off" className="h-[19px] w-[19px]" />
                          Remove organizer
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {canManage ? (
        <section className="w-full space-y-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2"><UiIcon name="mail-out" className="h-[22px] w-[22px] text-secondary" /><h2 className="text-[1.25rem] font-semibold text-on-surface">Waiting to join</h2><span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-wider text-on-secondary-fixed">{invitations.length} pending</span></div>
            <p className="mt-1 text-body-sm text-on-surface-variant">These invitations have been sent but have not been accepted yet.</p>
          </div>
          {invitations.length ? (
            <ul className="space-y-3">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container md:flex-row md:items-center">
                  <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary"><UiIcon name="mail-out" className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><p className="break-all text-title-md font-semibold text-on-surface">{invitation.email}</p><RoleBadge role={invitation.role} /><span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-semibold text-on-secondary-fixed-variant"><UiIcon name="clock" className="h-3 w-3" />Pending</span></div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-on-surface-variant"><span>Sent {formatDate(invitation.createdAt)}</span><span className="text-outline-variant">•</span><span className="font-medium text-secondary">{daysRemaining(invitation.expiresAt)}</span></p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
                    <button type="button" disabled={actionId === invitation.id || recentlyResentId === invitation.id} onClick={() => invitationAction(invitation.id, "resend")} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-4 py-2.5 text-label-md font-semibold transition-colors disabled:cursor-default ${recentlyResentId === invitation.id ? "bg-emerald-100 text-emerald-800" : "bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-60"}`}><UiIcon name={recentlyResentId === invitation.id ? "check-circle" : "refresh"} className={`h-4 w-4 ${actionId === invitation.id ? "animate-spin" : ""}`} />{actionId === invitation.id ? "Working…" : recentlyResentId === invitation.id ? "Sent" : "Resend"}</button>
                    <button type="button" onClick={() => setConfirmRevokeId(invitation.id)} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3.5 py-2.5 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-error"><UiIcon name="unavailable" className="h-4 w-4" />Revoke</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-surface-container-low px-4 py-10 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-outline"><UiIcon name="mail" className="h-6 w-6" /></span><p className="mt-3 text-title-md font-semibold text-on-surface">No pending invitations</p><p className="mx-auto mt-1 max-w-md text-body-sm text-on-surface-variant">Everyone you invited has joined, or you haven’t sent an invitation yet.</p></div>
          )}
        </section>
      ) : (
        <div className="flex items-start gap-3 rounded-xl bg-surface-container-high p-4 text-body-sm text-on-surface-variant"><UiIcon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" /><p>Only wedding Admins can invite new organizers and manage pending links.</p></div>
      )}

      <dialog ref={inviteDialogRef} onClose={() => { setDialogOpen(false); resetInvitationForm(); }} onCancel={(event) => { if (pending) event.preventDefault(); }} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92svh] w-full max-w-none overflow-hidden rounded-t-3xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-on-surface/45 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-h-[85svh] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-container-high/70 px-4 pb-4 pt-6 sm:px-6">
            <div className="min-w-0 pr-2"><div className="flex items-center gap-2"><UiIcon name="user-plus" className="h-6 w-6 shrink-0 text-primary" /><h2 className="text-[1.25rem] font-semibold">Invite someone to help</h2></div><p className="mt-1 text-body-sm leading-6 text-on-surface-variant">Send a secure invitation to a trusted family member or friend. They’ll receive an email with a link to join your wedding workspace.</p></div>
            <button type="button" onClick={closeDialog} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" aria-label="Close invitation form"><UiIcon name="close" className="h-5 w-5" /></button>
          </div>
          <form ref={inviteFormRef} onSubmit={submitInvitation} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" noValidate>
            {error ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"><UiIcon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />{error}</p> : null}
            <div className="space-y-1.5">
              <label htmlFor="invite-email" className="block text-title-md font-semibold">Email address</label>
              <div className="relative"><UiIcon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" /><input id="invite-email" name="email" type="email" autoComplete="email" maxLength={254} disabled={pending} onChange={() => setFieldErrors((current) => ({ ...current, email: [] }))} className={`w-full rounded-xl border-0 bg-surface-container-low py-3 pl-11 pr-4 text-body-md outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 ${fieldErrors.email?.length ? "ring-2 ring-error" : "focus:ring-primary"}`} placeholder="familymember@example.com" aria-invalid={Boolean(fieldErrors.email?.length)} /></div>
              {fieldErrors.email?.[0] ? <p className="flex items-center gap-1 text-body-sm text-error"><UiIcon name="warning" className="h-4 w-4" />{fieldErrors.email[0]}</p> : <p className="text-body-sm text-on-surface-variant">We’ll send the invitation to this email address.</p>}
            </div>
            <fieldset>
              <legend className="text-title-md font-semibold">Choose their role</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2"><RoleOption value="MANAGER" title="Manager" icon="manager" description="Can help manage events, guests, tasks, vendors, expenses, and day-to-day wedding planning." note="Best for cousins & coordinators" defaultChecked /><RoleOption value="ADMIN" title="Admin" icon="admin" description="Has full access, including inviting and managing other organizers." note="Best for bride, groom & parents" /></div>
            </fieldset>
            <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3 text-body-sm leading-6 text-on-surface-variant"><UiIcon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" /><p><strong className="text-on-surface">Family Trust Notice:</strong> Only invite people you trust. Organizers can view wedding planning information, guest contacts, and budget details.</p></div>
            <div className="flex flex-col-reverse items-center justify-between gap-3 pt-1 sm:flex-row">
              <p className="text-center text-body-sm text-on-surface-variant sm:text-left">The invitation link will be valid for 7 days.</p>
              <div className="flex w-full items-center gap-3 sm:w-auto"><button type="button" onClick={closeDialog} disabled={pending} className="min-h-11 w-1/2 rounded-xl border border-outline-variant px-5 py-2.5 text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container sm:w-auto">Cancel</button><button type="submit" disabled={pending} className="inline-flex min-h-11 w-1/2 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-title-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-wait disabled:opacity-60 sm:w-auto">{pending ? "Sending…" : "Send invitation"}<UiIcon name="send" className="h-[18px] w-[18px]" /></button></div>
            </div>
          </form>
        </div>
      </dialog>

      <dialog ref={memberDialogRef} onClose={() => setConfirmMemberAction(null)} onCancel={(event) => { if (actionId) event.preventDefault(); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm">
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${confirmMemberAction?.type === "remove" ? "bg-error-container text-error" : "bg-primary-fixed text-primary"}`}><UiIcon name={confirmMemberAction?.type === "remove" ? "account-off" : confirmMemberAction?.nextRole === "ADMIN" ? "admin" : "manager"} className="h-5 w-5" /></span>
            <div>
              <h3 className="text-[1.25rem] font-semibold">{confirmMemberAction?.type === "remove" ? "Remove this organizer?" : `Make ${memberToManage?.name ?? "this organizer"} a ${confirmMemberAction?.nextRole === "ADMIN" ? "Admin" : "Manager"}?`}</h3>
              <p className="mt-1 text-body-md leading-6 text-on-surface-variant">{confirmMemberAction?.type === "remove" ? `${memberToManage?.name ?? "This organizer"} will immediately lose access to this wedding. Their account and historical activity will be preserved, and they can be invited again later.` : confirmMemberAction?.nextRole === "ADMIN" ? "Admins can invite, remove, promote, and demote other organizers. Only grant this role to someone you fully trust." : "They will keep normal wedding-planning access but will no longer be able to manage organizer membership."}</p>
            </div>
          </div>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="button" disabled={Boolean(actionId)} onClick={() => setConfirmMemberAction(null)} className="min-h-10 rounded-xl bg-surface-container px-4 py-2.5 text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60">Cancel</button>
            <button type="button" disabled={!confirmMemberAction || Boolean(actionId)} onClick={() => confirmMemberAction && manageMember(confirmMemberAction)} className={`min-h-10 rounded-xl px-5 py-2.5 text-title-md font-semibold shadow-sm transition-colors disabled:opacity-60 ${confirmMemberAction?.type === "remove" ? "bg-error text-on-error hover:bg-on-error-container" : "bg-primary text-on-primary hover:bg-primary-container"}`}>{actionId ? "Updating…" : confirmMemberAction?.type === "remove" ? "Remove organizer" : "Change role"}</button>
          </div>
        </div>
      </dialog>

      <dialog ref={revokeDialogRef} onClose={() => setConfirmRevokeId(null)} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm">
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error"><UiIcon name="warning" className="h-5 w-5" /></span><div><h3 className="text-[1.25rem] font-semibold">Revoke this invitation?</h3><p className="mt-1 text-body-md leading-6 text-on-surface-variant">The invitation for {invitationToRevoke?.email ?? "this person"} will stop working immediately. You can invite them again later.</p></div></div>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" onClick={() => setConfirmRevokeId(null)} className="min-h-10 rounded-xl bg-surface-container px-4 py-2.5 text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high">Keep invitation</button><button type="button" disabled={!confirmRevokeId || actionId === confirmRevokeId} onClick={() => confirmRevokeId && invitationAction(confirmRevokeId, "revoke")} className="min-h-10 rounded-xl bg-error px-5 py-2.5 text-title-md font-semibold text-on-error shadow-sm transition-colors hover:bg-on-error-container disabled:opacity-60">{actionId === confirmRevokeId ? "Revoking…" : "Revoke invitation"}</button></div>
        </div>
      </dialog>
    </div>
  );
}

function RoleBadge({ role }: { role: "ADMIN" | "MANAGER" }) {
  return <span className={`rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${role === "ADMIN" ? "text-primary" : "text-secondary"}`}>{role === "ADMIN" ? "Admin" : "Manager"}</span>;
}

function RoleOption({ value, title, icon, description, note, defaultChecked = false }: { value: "ADMIN" | "MANAGER"; title: string; icon: UiIconName; description: string; note: string; defaultChecked?: boolean }) {
  return (
    <label className="relative flex cursor-pointer flex-col justify-between rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container has-[:checked]:bg-surface-container has-[:checked]:ring-2 has-[:checked]:ring-primary">
      <input type="radio" name="role" value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-outline-variant text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary"><UiIcon name="check-circle" className="h-4 w-4" /></span>
      <span><strong className="flex items-center gap-2 pr-7 text-title-md"><UiIcon name={icon} className={`h-5 w-5 ${value === "MANAGER" ? "text-secondary" : "text-primary"}`} />{title}</strong><span className="mt-2 block text-body-sm leading-5 text-on-surface-variant">{description}</span></span>
      <span className={`mt-3 block border-t border-surface-container-highest/70 pt-2 text-[11px] font-semibold uppercase tracking-wide ${value === "MANAGER" ? "text-secondary" : "text-on-surface-variant"}`}>{note}</span>
    </label>
  );
}
