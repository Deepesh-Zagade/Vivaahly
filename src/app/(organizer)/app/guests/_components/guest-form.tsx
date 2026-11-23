"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UiIcon } from "@/components/ui-icon";
import {
  guestInputSchema,
  type GuestInput,
} from "@/modules/guests/guest.schemas";
import {
  GUEST_TAG_LABELS,
  GUEST_TAGS,
  type GuestDto,
  type GuestTag,
  type GuestType,
} from "@/modules/guests/guest.types";
import {
  buildGuestDetailsHref,
  buildGuestEditExitHref,
} from "@/modules/guests/guest.navigation";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

export type GuestEventOption = {
  id: string;
  title: string;
  dayLabel: string;
  timeLabel: string;
  location?: string;
};

type FormValues = {
  guestType: GuestType;
  displayNameEn: string;
  displayNameMr: string;
  primaryNameEn: string;
  primaryNameMr: string;
  email: string;
  phone: string;
  tags: GuestTag[];
  eventIds: string[];
  organizerNotes: string;
};

type FieldName =
  | "displayName.en"
  | "displayName.mr"
  | "primaryContact.name.en"
  | "primaryContact.name.mr"
  | "primaryContact.email"
  | "primaryContact.phone"
  | "tags"
  | "eventIds"
  | "organizerNotes";

type ApiResponse = {
  data?: { guest?: GuestDto; eventIds?: string[] };
  error?: {
    message?: string;
    details?: { fieldErrors?: Record<string, string[]> };
  };
};

const emptyValues: FormValues = {
  guestType: "INDIVIDUAL",
  displayNameEn: "",
  displayNameMr: "",
  primaryNameEn: "",
  primaryNameMr: "",
  email: "",
  phone: "",
  tags: [],
  eventIds: [],
  organizerNotes: "",
};

const inputClassName =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 disabled:cursor-wait disabled:bg-surface-container-low disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error/15";

function valuesFromGuest(guest: GuestDto, eventIds: string[]): FormValues {
  return {
    guestType: guest.guestType,
    displayNameEn: guest.displayName.en,
    displayNameMr: guest.displayName.mr ?? "",
    primaryNameEn: guest.primaryContact.name.en,
    primaryNameMr: guest.primaryContact.name.mr ?? "",
    email: guest.primaryContact.email ?? "",
    phone: guest.primaryContact.phone ?? "",
    tags: guest.tags,
    eventIds,
    organizerNotes: guest.organizerNotes ?? "",
  };
}

function buildInput(values: FormValues) {
  const individual = values.guestType === "INDIVIDUAL";
  return {
    guestType: values.guestType,
    displayName: { en: values.displayNameEn, mr: values.displayNameMr },
    primaryContact: {
      name: {
        en: individual ? values.displayNameEn : values.primaryNameEn,
        mr: individual ? values.displayNameMr : values.primaryNameMr,
      },
      email: values.email,
      phone: values.phone,
    },
    tags: values.tags,
    organizerNotes: values.organizerNotes,
  };
}

function validationErrors(values: FormValues) {
  const result = guestInputSchema.safeParse(buildInput(values));
  const errors: Partial<Record<FieldName, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      let path = issue.path.join(".") as FieldName;
      if (
        values.guestType === "INDIVIDUAL" &&
        (path === "primaryContact.name.en" ||
          path === "primaryContact.name.mr")
      ) {
        path = path.endsWith(".en") ? "displayName.en" : "displayName.mr";
      }
      if (!errors[path]) errors[path] = issue.message;
    }
  }
  return { result, errors };
}

export function GuestForm({
  events,
  guest,
  assignedEventIds = [],
  returnTo,
}: {
  events: GuestEventOption[];
  guest?: GuestDto;
  assignedEventIds?: string[];
  returnTo: string;
}) {
  const router = useRouter();
  const editing = Boolean(guest);
  const [values, setValues] = useState<FormValues>(() =>
    guest ? valuesFromGuest(guest, assignedEventIds) : emptyValues,
  );
  const [persistedGuestId, setPersistedGuestId] = useState(guest?.id);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    setFormError(null);
    if (Object.keys(fieldErrors).length) {
      const nextErrors = validationErrors(next).errors;
      setFieldErrors((current) => {
        const updated = { ...current };
        const related: FieldName[] =
          key === "displayNameEn"
            ? ["displayName.en", "primaryContact.name.en"]
            : key === "displayNameMr"
              ? ["displayName.mr", "primaryContact.name.mr"]
              : key === "primaryNameEn"
                ? ["primaryContact.name.en"]
                : key === "primaryNameMr"
                  ? ["primaryContact.name.mr"]
                  : key === "email"
                    ? ["primaryContact.email"]
                    : key === "phone"
                      ? ["primaryContact.phone"]
                      : key === "tags"
                        ? ["tags"]
                        : key === "eventIds"
                          ? ["eventIds"]
                          : key === "organizerNotes"
                            ? ["organizerNotes"]
                            : [];
        for (const field of related) {
          if (!current[field]) continue;
          if (nextErrors[field]) updated[field] = nextErrors[field];
          else delete updated[field];
        }
        return updated;
      });
    }
  }

  function toggleTag(tag: GuestTag) {
    updateValue(
      "tags",
      values.tags.includes(tag)
        ? values.tags.filter((candidate) => candidate !== tag)
        : [...values.tags, tag],
    );
  }

  function toggleEvent(eventId: string) {
    updateValue(
      "eventIds",
      values.eventIds.includes(eventId)
        ? values.eventIds.filter((candidate) => candidate !== eventId)
        : [...values.eventIds, eventId],
    );
  }

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    if (pending) return;
    setFormError(null);
    const { result, errors } = validationErrors(values);
    setFieldErrors(errors);
    if (!result.success) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    setPending(true);
    let navigationStarted = false;
    try {
      const guestId = persistedGuestId;
      const guestResponse = await fetchWithTimeout(
        guestId ? `/api/v1/guests/${guestId}` : "/api/v1/guests",
        {
          method: guestId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(result.data satisfies GuestInput),
        },
      );
      const guestBody = (await guestResponse.json()) as ApiResponse;
      if (!guestResponse.ok || !guestBody.data?.guest) {
        applyServerErrors(guestBody, setFieldErrors);
        setFormError(
          guestBody.error?.message ??
            `We couldn't ${editing ? "update" : "add"} this guest.`,
        );
        return;
      }

      const savedGuestId = guestBody.data.guest.id;
      setPersistedGuestId(savedGuestId);
      const eventResponse = await fetchWithTimeout(
        `/api/v1/guests/${savedGuestId}/events`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventIds: values.eventIds }),
        },
      );
      const eventBody = (await eventResponse.json()) as ApiResponse;
      if (!eventResponse.ok) {
        applyServerErrors(eventBody, setFieldErrors);
        setFormError(
          eventBody.error?.message ??
            "The guest profile was saved, but ceremony access could not be updated. Please try saving again.",
        );
        return;
      }

      navigationStarted = true;
      router.replace(
        buildGuestDetailsHref(
          savedGuestId,
          returnTo,
          editing ? "guest-updated" : "guest-created",
        ),
      );
      router.refresh();
    } catch (caught) {
      setFormError(
        caught instanceof RequestTimeoutError
          ? "Vivaahly took too long to respond. Your entries are still here; please try again."
          : "We couldn't reach Vivaahly. Check your connection and try again.",
      );
    } finally {
      if (!navigationStarted) setPending(false);
    }
  }

  const disabled = pending;
  const individual = values.guestType === "INDIVIDUAL";
  const allSelected = events.length > 0 && values.eventIds.length === events.length;
  const eventDayNumbers = new Map<string, number>();
  for (const event of events) {
    if (!eventDayNumbers.has(event.dayLabel)) {
      eventDayNumbers.set(event.dayLabel, eventDayNumbers.size + 1);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(23rem,0.88fr)]"
    >
      {formError ? (
        <div className="rounded-xl bg-error-container p-4 text-body-sm text-on-error-container xl:col-span-2" role="alert">
          <p className="font-semibold">We couldn&apos;t finish saving this guest</p>
          <p className="mt-1">{formError}</p>
        </div>
      ) : null}

      <FormSection title="Guest profile type" className="xl:col-start-1 xl:row-start-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <TypeCard type="INDIVIDUAL" selected={individual} disabled={disabled} onSelect={() => updateValue("guestType", "INDIVIDUAL")} icon="user-plus" title="Individual guest" detail="One invited person with their own contact details." />
          <TypeCard type="FAMILY" selected={!individual} disabled={disabled} onSelect={() => updateValue("guestType", "FAMILY")} icon="users" title="Family guest" detail="One primary invitee represents the family, which responds collectively." />
        </div>
      </FormSection>

      <FormSection title="Guest details" className="xl:col-start-1 xl:row-start-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="guest-display-name-en" label={individual ? "Guest name in English" : "Family display name in English"} required error={fieldErrors["displayName.en"]}>
            <input id="guest-display-name-en" value={values.displayNameEn} onChange={(event) => updateValue("displayNameEn", event.target.value)} disabled={disabled} maxLength={120} placeholder={individual ? "Ananya Sen" : "Kulkarni Family"} aria-invalid={Boolean(fieldErrors["displayName.en"])} className={inputClassName} />
          </FormField>
          <FormField id="guest-display-name-mr" label={individual ? "Guest name in Marathi" : "Family display name in Marathi"} optional error={fieldErrors["displayName.mr"]}>
            <input id="guest-display-name-mr" lang="mr" value={values.displayNameMr} onChange={(event) => updateValue("displayNameMr", event.target.value)} disabled={disabled} maxLength={120} aria-invalid={Boolean(fieldErrors["displayName.mr"])} className={inputClassName} />
          </FormField>
          {!individual ? (
            <>
              <FormField id="guest-primary-name-en" label="Primary invitee name in English" required error={fieldErrors["primaryContact.name.en"]}>
                <input id="guest-primary-name-en" value={values.primaryNameEn} onChange={(event) => updateValue("primaryNameEn", event.target.value)} disabled={disabled} maxLength={120} placeholder="Rajesh Kulkarni" aria-invalid={Boolean(fieldErrors["primaryContact.name.en"])} className={inputClassName} />
              </FormField>
              <FormField id="guest-primary-name-mr" label="Primary invitee name in Marathi" optional error={fieldErrors["primaryContact.name.mr"]}>
                <input id="guest-primary-name-mr" lang="mr" value={values.primaryNameMr} onChange={(event) => updateValue("primaryNameMr", event.target.value)} disabled={disabled} maxLength={120} aria-invalid={Boolean(fieldErrors["primaryContact.name.mr"])} className={inputClassName} />
              </FormField>
            </>
          ) : null}
          <FormField id="guest-email" label={individual ? "Email address" : "Primary invitee email"} optional error={fieldErrors["primaryContact.email"]} helper="Optional now; required later when sending an email invitation.">
            <input id="guest-email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} disabled={disabled} maxLength={254} placeholder="guest@example.com" aria-invalid={Boolean(fieldErrors["primaryContact.email"])} className={inputClassName} />
          </FormField>
          <FormField id="guest-phone" label={individual ? "Contact number" : "Primary invitee contact number"} optional error={fieldErrors["primaryContact.phone"]} helper="Stored for organizer reference only.">
            <input id="guest-phone" type="tel" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} disabled={disabled} maxLength={30} placeholder="+91 98201 44521" aria-invalid={Boolean(fieldErrors["primaryContact.phone"])} className={inputClassName} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Categorization and tags" className="xl:col-start-1 xl:row-start-3">
        <p className="mb-3 text-body-sm text-on-surface-variant">Combine a wedding side with a relationship tag when useful—for example, Bride&apos;s Side and Friends.</p>
        <div className="flex flex-wrap gap-2">
          {GUEST_TAGS.map((tag) => {
            const selected = values.tags.includes(tag);
            return (
              <button key={tag} type="button" disabled={disabled} aria-pressed={selected} onClick={() => toggleTag(tag)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-sm font-semibold transition-colors ${selected ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/35 hover:text-primary"}`}>
                {selected ? <UiIcon name="check-circle" className="h-3.5 w-3.5" /> : null}
                {GUEST_TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
        {fieldErrors.tags ? <FieldError message={fieldErrors.tags} /> : null}
      </FormSection>

      <FormSection title="Invited ceremonies" className="xl:col-start-2 xl:row-span-4 xl:row-start-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm text-on-surface-variant">Choose which ceremonies this guest or family can access.</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">{values.eventIds.length} of {events.length} selected</span>
          {events.length ? (
            <button type="button" disabled={disabled} onClick={() => updateValue("eventIds", allSelected ? [] : events.map((event) => event.id))} className="min-h-9 px-1 text-label-sm font-semibold text-primary hover:underline disabled:opacity-60">
              {allSelected ? "Clear all" : "Select all"}
            </button>
          ) : null}
          </div>
        </div>
        {events.length ? (
          <div className="space-y-2">
            {events.map((event) => {
              const selected = values.eventIds.includes(event.id);
              return (
                <label key={event.id} className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${selected ? "bg-primary/8 shadow-[inset_3px_0_0_var(--color-primary)]" : "bg-surface-container-low hover:bg-surface-container-high"}`}>
                  <input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleEvent(event.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3"><span className="text-body-md font-semibold text-on-surface">{event.title}</span><span className="shrink-0 rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">Day {eventDayNumbers.get(event.dayLabel)}</span></span>
                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-on-surface-variant">{event.dayLabel} · {event.timeLabel}{event.location ? ` · ${event.location}` : ""}</span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-center">
            <p className="text-body-md font-semibold text-on-surface">No wedding events are available yet.</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">You can save this guest now and assign ceremonies after creating an event.</p>
            <Link href="/app/events/new" className="mt-3 inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-primary hover:underline"><UiIcon name="plus" className="h-4 w-4" />Create an event</Link>
          </div>
        )}
        {fieldErrors.eventIds ? <FieldError message={fieldErrors.eventIds} /> : null}
      </FormSection>

      <FormSection title="Organizer-only notes" className="xl:col-start-1 xl:row-start-4" icon="lock">
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5">
          <p className="mb-3 flex items-start gap-2 text-body-sm leading-5 text-on-surface-variant"><UiIcon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />These notes remain private to wedding organizers.</p>
          <FormField id="guest-notes" label="Private organizer notes" optional error={fieldErrors.organizerNotes}>
            <textarea id="guest-notes" value={values.organizerNotes} onChange={(event) => updateValue("organizerNotes", event.target.value)} disabled={disabled} maxLength={2000} rows={3} placeholder="Accessibility needs, family context, or coordination notes..." aria-invalid={Boolean(fieldErrors.organizerNotes)} className={`${inputClassName} resize-y`} />
          </FormField>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse justify-end gap-2 pt-1 sm:flex-row xl:col-span-2">
        <button type="button" disabled={pending} onClick={() => router.push(guest ? buildGuestEditExitHref(guest.id, returnTo) : returnTo)} className="min-h-12 rounded-xl px-6 py-3 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-colors hover:bg-primary-container disabled:cursor-wait disabled:opacity-70">
          {pending ? <LoadingSpinner /> : null}
          {pending ? (editing ? "Saving changes…" : "Adding guest…") : editing ? "Save changes" : "Add guest"}
          {!pending ? <UiIcon name="arrow-right" className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}

function applyServerErrors(body: ApiResponse, setter: React.Dispatch<React.SetStateAction<Partial<Record<FieldName, string>>>>) {
  const serverErrors = body.error?.details?.fieldErrors;
  if (!serverErrors) return;
  setter(Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0]])) as Partial<Record<FieldName, string>>);
}

function TypeCard({ type, selected, disabled, onSelect, icon, title, detail }: { type: GuestType; selected: boolean; disabled: boolean; onSelect: () => void; icon: "user-plus" | "users"; title: string; detail: string }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-primary/35 bg-primary/5" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"}`}><input type="radio" name="guest-type" value={type} checked={selected} disabled={disabled} onChange={onSelect} className="mt-1 accent-primary" /><span><span className={`flex items-center gap-2 text-title-md font-semibold ${selected ? "text-primary" : "text-on-surface"}`}><UiIcon name={icon} className="h-4 w-4" />{title}</span><span className="mt-0.5 block text-body-sm leading-5 text-on-surface-variant">{detail}</span></span></label>;
}

function FormSection({ title, className = "", icon, children }: { title: string; className?: string; icon?: "lock"; children: ReactNode }) {
  return <fieldset className={`rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-sm sm:p-5 ${className}`}><div className="mb-4 flex items-center gap-3"><legend className="flex shrink-0 items-center gap-2 font-headline-lg text-xl font-semibold text-on-surface">{icon ? <UiIcon name={icon} className="h-4 w-4 text-primary" /> : null}{title}</legend><span className="h-px flex-1 bg-outline-variant/70" /></div>{children}</fieldset>;
}

function FormField({ id, label, required, optional, helper, error, children }: { id: string; label: string; required?: boolean; optional?: boolean; helper?: string; error?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="mb-1.5 flex items-center justify-between gap-3 text-label-md font-semibold text-on-surface"><span>{label}{required ? <span className="ml-1 text-error">*</span> : null}</span>{optional ? <span className="text-[11px] font-medium text-outline">Optional</span> : null}</label>{children}{error ? <FieldError message={error} /> : helper ? <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">{helper}</p> : null}</div>;
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-5 text-error" role="alert"><UiIcon name="warning" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</p>;
}
