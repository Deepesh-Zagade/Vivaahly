"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { UiIcon } from "@/components/ui-icon";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/modules/events/event.schemas";
import type { WeddingEventDto } from "@/modules/events/event.types";
import {
  dateTimePartsInTimezone,
  formatTimezoneName,
  zonedDateTimeToIso,
} from "@/shared/dates/zoned-date-time";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

type EventFormValues = {
  titleEn: string;
  titleMr: string;
  descriptionEn: string;
  descriptionMr: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venueNameEn: string;
  venueNameMr: string;
  venueAddressEn: string;
  venueAddressMr: string;
  mapUrl: string;
  dressCodeEn: string;
  dressCodeMr: string;
  privateNotes: string;
};

type FieldName =
  | "title.en"
  | "title.mr"
  | "description.en"
  | "description.mr"
  | "startAt"
  | "endAt"
  | "venue.name.en"
  | "venue.name.mr"
  | "venue.address.en"
  | "venue.address.mr"
  | "venue.mapUrl"
  | "dressCode.en"
  | "dressCode.mr"
  | "privateNotes";

type EventResponse = {
  data?: { event: WeddingEventDto };
  error?: {
    code?: string;
    message?: string;
    details?: { fieldErrors?: Record<string, string[]> };
  };
};

const emptyValues: EventFormValues = {
  titleEn: "",
  titleMr: "",
  descriptionEn: "",
  descriptionMr: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  venueNameEn: "",
  venueNameMr: "",
  venueAddressEn: "",
  venueAddressMr: "",
  mapUrl: "",
  dressCodeEn: "",
  dressCodeMr: "",
  privateNotes: "",
};

const fieldByValue: Record<keyof EventFormValues, FieldName> = {
  titleEn: "title.en",
  titleMr: "title.mr",
  descriptionEn: "description.en",
  descriptionMr: "description.mr",
  startDate: "startAt",
  startTime: "startAt",
  endDate: "endAt",
  endTime: "endAt",
  venueNameEn: "venue.name.en",
  venueNameMr: "venue.name.mr",
  venueAddressEn: "venue.address.en",
  venueAddressMr: "venue.address.mr",
  mapUrl: "venue.mapUrl",
  dressCodeEn: "dressCode.en",
  dressCodeMr: "dressCode.mr",
  privateNotes: "privateNotes",
};

const inputClassName =
  "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 disabled:cursor-wait disabled:bg-surface-container-low disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error/15";

function valuesFromEvent(event: WeddingEventDto, timezone: string) {
  const start = dateTimePartsInTimezone(new Date(event.startAt), timezone);
  const end = dateTimePartsInTimezone(new Date(event.endAt), timezone);
  return {
    titleEn: event.title.en,
    titleMr: event.title.mr ?? "",
    descriptionEn: event.description.en ?? "",
    descriptionMr: event.description.mr ?? "",
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    venueNameEn: event.venue.name.en ?? "",
    venueNameMr: event.venue.name.mr ?? "",
    venueAddressEn: event.venue.address.en ?? "",
    venueAddressMr: event.venue.address.mr ?? "",
    mapUrl: event.venue.mapUrl ?? "",
    dressCodeEn: event.dressCode.en ?? "",
    dressCodeMr: event.dressCode.mr ?? "",
    privateNotes: event.privateNotes ?? "",
  } satisfies EventFormValues;
}

function buildInput(values: EventFormValues, timezone: string) {
  const startAt = zonedDateTimeToIso(
    values.startDate,
    values.startTime,
    timezone,
  );
  const endAt = zonedDateTimeToIso(
    values.endDate,
    values.endTime,
    timezone,
  );
  return {
    title: { en: values.titleEn, mr: values.titleMr },
    description: { en: values.descriptionEn, mr: values.descriptionMr },
    startAt: startAt ?? "",
    endAt: endAt ?? "",
    venue: {
      name: { en: values.venueNameEn, mr: values.venueNameMr },
      address: { en: values.venueAddressEn, mr: values.venueAddressMr },
      mapUrl: values.mapUrl,
    },
    dressCode: { en: values.dressCodeEn, mr: values.dressCodeMr },
    privateNotes: values.privateNotes,
  };
}

function validationErrors(
  values: EventFormValues,
  timezone: string,
  minimumEventDate?: string,
) {
  const result = createEventSchema.safeParse(buildInput(values, timezone));
  const errors: Partial<Record<FieldName, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") as FieldName;
      if (!errors[field]) errors[field] = issue.message;
    }
  }
  if (
    minimumEventDate &&
    values.startDate &&
    values.startDate < minimumEventDate
  ) {
    errors.startAt = "Choose today or a future event date.";
  }
  return { result, errors };
}

export function EventForm({
  timezone,
  event,
  minimumEventDate,
}: {
  timezone: string;
  event?: WeddingEventDto;
  minimumEventDate?: string;
}) {
  const router = useRouter();
  const editing = Boolean(event);
  const [values, setValues] = useState<EventFormValues>(() =>
    event ? valuesFromEvent(event, timezone) : emptyValues,
  );
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});

  function updateValue(key: keyof EventFormValues, value: string) {
    const next = { ...values, [key]: value };
    if (
      key === "startDate" &&
      (!values.endDate || values.endDate === values.startDate)
    ) {
      next.endDate = value;
    }
    const field = fieldByValue[key];
    setValues(next);
    setFormError(null);
    const scheduleChanged =
      key === "startDate" ||
      key === "startTime" ||
      key === "endDate" ||
      key === "endTime";
    const fieldsToCheck: FieldName[] = scheduleChanged
      ? ["startAt", "endAt"]
      : [field];
    if (fieldsToCheck.some((candidate) => fieldErrors[candidate])) {
      const nextErrors = validationErrors(
        next,
        timezone,
        minimumEventDate,
      ).errors;
      setFieldErrors((current) => {
        const updated = { ...current };
        for (const candidate of fieldsToCheck) {
          if (!current[candidate]) continue;
          if (nextErrors[candidate]) updated[candidate] = nextErrors[candidate];
          else delete updated[candidate];
        }
        return updated;
      });
    }
  }

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    if (pending) return;
    setFormError(null);

    const { result, errors } = validationErrors(
      values,
      timezone,
      minimumEventDate,
    );
    setFieldErrors(errors);
    if (!result.success || Object.keys(errors).length > 0) {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setPending(true);
    try {
      const response = await fetchWithTimeout(
        event ? `/api/v1/events/${event.id}` : "/api/v1/events",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(result.data satisfies CreateEventInput),
        },
      );
      const body = (await response.json()) as EventResponse;
      if (!response.ok) {
        const serverErrors = body.error?.details?.fieldErrors;
        if (serverErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(serverErrors).map(([key, messages]) => [
                key,
                messages[0],
              ]),
            ),
          );
        }
        setFormError(
          body.error?.message ??
            `We couldn't ${editing ? "update" : "create"} this event.`,
        );
        return;
      }
      if (!body.data?.event) {
        setFormError("We couldn't confirm that the event was saved.");
        return;
      }
      router.replace(
        `/app/events/${body.data.event.id}?notice=${editing ? "event-updated" : "event-created"}`,
      );
      router.refresh();
    } catch (caught) {
      setFormError(
        caught instanceof RequestTimeoutError
          ? "Vivaahly took too long to respond. Please try again shortly."
          : "We couldn't reach Vivaahly. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const disabled = pending;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-[0_18px_45px_rgba(44,28,33,0.08)] sm:p-8 md:p-10"
    >
      {formError ? (
        <div
          className="mb-7 rounded-xl bg-error-container p-4 text-body-sm text-on-error-container"
          role="alert"
        >
          <p className="font-semibold">
            We couldn&apos;t {editing ? "update" : "create"} this event
          </p>
          <p className="mt-1">{formError}</p>
        </div>
      ) : null}

      <FormSection title="Event information">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="event-title-en" label="Event name in English" required error={fieldErrors["title.en"]}>
            <input id="event-title-en" value={values.titleEn} onChange={(e) => updateValue("titleEn", e.target.value)} disabled={disabled} maxLength={120} placeholder="Sangeet & Musical Evening" aria-invalid={Boolean(fieldErrors["title.en"])} className={inputClassName} />
          </FormField>
          <FormField id="event-title-mr" label="Event name in Marathi" optional error={fieldErrors["title.mr"]}>
            <input id="event-title-mr" lang="mr" value={values.titleMr} onChange={(e) => updateValue("titleMr", e.target.value)} disabled={disabled} maxLength={120} placeholder="संगीत व सुरमयी संध्या" aria-invalid={Boolean(fieldErrors["title.mr"])} className={inputClassName} />
          </FormField>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FormField id="event-description-en" label="Description in English" optional error={fieldErrors["description.en"]}>
            <textarea id="event-description-en" value={values.descriptionEn} onChange={(e) => updateValue("descriptionEn", e.target.value)} disabled={disabled} maxLength={2000} rows={4} aria-invalid={Boolean(fieldErrors["description.en"])} className={`${inputClassName} resize-y`} />
          </FormField>
          <FormField id="event-description-mr" label="Description in Marathi" optional error={fieldErrors["description.mr"]}>
            <textarea id="event-description-mr" lang="mr" value={values.descriptionMr} onChange={(e) => updateValue("descriptionMr", e.target.value)} disabled={disabled} maxLength={2000} rows={4} aria-invalid={Boolean(fieldErrors["description.mr"])} className={`${inputClassName} resize-y`} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Date and time" className="mt-10">
        <p className="mb-5 rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
          Event times use the wedding timezone: <strong className="font-semibold text-on-surface">{formatTimezoneName(timezone)}</strong>.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField id="event-start-date" label="Start date" required error={fieldErrors.startAt}>
            <input id="event-start-date" type="date" min={minimumEventDate} value={values.startDate} onChange={(e) => updateValue("startDate", e.target.value)} disabled={disabled} aria-invalid={Boolean(fieldErrors.startAt)} className={inputClassName} />
          </FormField>
          <FormField id="event-start-time" label="Start time" required>
            <input id="event-start-time" type="time" value={values.startTime} onChange={(e) => updateValue("startTime", e.target.value)} disabled={disabled} aria-invalid={Boolean(fieldErrors.startAt)} className={inputClassName} />
          </FormField>
          <FormField id="event-end-date" label="End date" required error={fieldErrors.endAt}>
            <input id="event-end-date" type="date" value={values.endDate} onChange={(e) => updateValue("endDate", e.target.value)} disabled={disabled} aria-invalid={Boolean(fieldErrors.endAt)} className={inputClassName} />
          </FormField>
          <FormField id="event-end-time" label="End time" required>
            <input id="event-end-time" type="time" value={values.endTime} onChange={(e) => updateValue("endTime", e.target.value)} disabled={disabled} aria-invalid={Boolean(fieldErrors.endAt)} className={inputClassName} />
          </FormField>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-on-surface-variant">
          Use the following date as the end date when a celebration continues after midnight.
        </p>
      </FormSection>

      <FormSection title="Venue and location" className="mt-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="venue-name-en" label="Venue name in English" optional error={fieldErrors["venue.name.en"]}>
            <input id="venue-name-en" value={values.venueNameEn} onChange={(e) => updateValue("venueNameEn", e.target.value)} disabled={disabled} maxLength={160} placeholder="The Courtyard Pavilion" aria-invalid={Boolean(fieldErrors["venue.name.en"])} className={inputClassName} />
          </FormField>
          <FormField id="venue-name-mr" label="Venue name in Marathi" optional error={fieldErrors["venue.name.mr"]}>
            <input id="venue-name-mr" lang="mr" value={values.venueNameMr} onChange={(e) => updateValue("venueNameMr", e.target.value)} disabled={disabled} maxLength={160} aria-invalid={Boolean(fieldErrors["venue.name.mr"])} className={inputClassName} />
          </FormField>
          <FormField id="venue-address-en" label="Venue address in English" optional error={fieldErrors["venue.address.en"]}>
            <textarea id="venue-address-en" value={values.venueAddressEn} onChange={(e) => updateValue("venueAddressEn", e.target.value)} disabled={disabled} maxLength={300} rows={3} aria-invalid={Boolean(fieldErrors["venue.address.en"])} className={`${inputClassName} resize-y`} />
          </FormField>
          <FormField id="venue-address-mr" label="Venue address in Marathi" optional error={fieldErrors["venue.address.mr"]}>
            <textarea id="venue-address-mr" lang="mr" value={values.venueAddressMr} onChange={(e) => updateValue("venueAddressMr", e.target.value)} disabled={disabled} maxLength={300} rows={3} aria-invalid={Boolean(fieldErrors["venue.address.mr"])} className={`${inputClassName} resize-y`} />
          </FormField>
        </div>
        <div className="mt-5">
          <FormField id="venue-map-url" label="Google Maps or location link" optional error={fieldErrors["venue.mapUrl"]}>
            <input id="venue-map-url" type="url" value={values.mapUrl} onChange={(e) => updateValue("mapUrl", e.target.value)} disabled={disabled} placeholder="https://maps.google.com/..." aria-invalid={Boolean(fieldErrors["venue.mapUrl"])} className={inputClassName} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Guest-facing details" className="mt-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="dress-code-en" label="Dress code in English" optional error={fieldErrors["dressCode.en"]}>
            <input id="dress-code-en" value={values.dressCodeEn} onChange={(e) => updateValue("dressCodeEn", e.target.value)} disabled={disabled} maxLength={200} placeholder="Festive pastels and vibrant florals" aria-invalid={Boolean(fieldErrors["dressCode.en"])} className={inputClassName} />
          </FormField>
          <FormField id="dress-code-mr" label="Dress code in Marathi" optional error={fieldErrors["dressCode.mr"]}>
            <input id="dress-code-mr" lang="mr" value={values.dressCodeMr} onChange={(e) => updateValue("dressCodeMr", e.target.value)} disabled={disabled} maxLength={200} aria-invalid={Boolean(fieldErrors["dressCode.mr"])} className={inputClassName} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Organizer-only notes" className="mt-10" icon="lock">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
          <p className="mb-4 flex items-start gap-2 text-body-sm leading-6 text-on-surface-variant">
            <UiIcon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            These notes are visible only to wedding organizers and are never shared with guests.
          </p>
          <FormField id="private-notes" label="Private organizer notes" optional error={fieldErrors.privateNotes}>
            <textarea id="private-notes" value={values.privateNotes} onChange={(e) => updateValue("privateNotes", e.target.value)} disabled={disabled} maxLength={2000} rows={5} placeholder="Vendor arrival times, accessibility arrangements, or family coordination notes..." aria-invalid={Boolean(fieldErrors.privateNotes)} className={`${inputClassName} resize-y`} />
          </FormField>
        </div>
      </FormSection>

      <div className="mt-10 flex flex-col-reverse justify-end gap-3 border-t border-outline-variant/70 pt-6 sm:flex-row">
        <button type="button" disabled={pending} onClick={() => router.push(event ? `/app/events/${event.id}` : "/app/events")} className="min-h-12 rounded-xl px-6 py-3 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-colors hover:bg-primary-container disabled:cursor-wait disabled:opacity-70">
          {pending ? <Spinner /> : null}
          {pending ? "Saving changes…" : editing ? "Save changes" : "Create event"}
          {!pending ? <UiIcon name="arrow-right" className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}

function FormSection({ title, className = "", icon, children }: { title: string; className?: string; icon?: "lock"; children: ReactNode }) {
  return (
    <fieldset className={className}>
      <legend className="mb-5 flex w-full items-center gap-3 text-headline-sm font-semibold text-on-surface">
        {icon ? <UiIcon name={icon} className="h-5 w-5 text-primary" /> : null}
        <span>{title}</span>
        <span className="h-px flex-1 bg-outline-variant/70" />
      </legend>
      {children}
    </fieldset>
  );
}

function FormField({ id, label, required = false, optional = false, error, children }: { id: string; label: string; required?: boolean; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex min-h-6 items-center justify-between gap-3 text-label-md font-semibold text-on-surface">
        <span>{label}{required ? <span className="text-error"> *</span> : null}</span>
        {optional ? <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">Optional</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[12px] leading-5 text-error" role="alert">{error}</p> : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z" />
    </svg>
  );
}
