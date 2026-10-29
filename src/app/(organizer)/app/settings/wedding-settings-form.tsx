"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  buildWeddingUpdateInput,
  changedWeddingFieldError,
  fieldNameByValueKey,
  type WeddingSettingsFieldName,
  type WeddingSettingsFormValues,
} from "@/app/(organizer)/app/settings/wedding-settings.validation";
import { updateWeddingSchema } from "@/modules/wedding/wedding.schemas";
import type { WeddingDto } from "@/modules/wedding/wedding.types";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

type UpdateWeddingResponse = {
  data?: { wedding: WeddingDto };
  error?: {
    code?: string;
    message?: string;
    details?: {
      fieldErrors?: Partial<Record<WeddingSettingsFieldName, string[]>>;
    };
  };
};

const inputClassName =
  "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-75";

function valuesFromWedding(wedding: WeddingDto): WeddingSettingsFormValues {
  return {
    brideNameEn: wedding.couple.bride.name.en,
    brideNameMr: wedding.couple.bride.name.mr ?? "",
    groomNameEn: wedding.couple.groom.name.en,
    groomNameMr: wedding.couple.groom.name.mr ?? "",
    titleEn: wedding.title.en,
    mainWeddingDate: wedding.mainWeddingDate,
    timezone: wedding.timezone,
    cityEn: wedding.primaryVenue.city.en,
  };
}

export function WeddingSettingsForm({
  wedding,
  editable: initiallyEditable,
  minimumWeddingDate,
}: {
  wedding: WeddingDto;
  editable: boolean;
  minimumWeddingDate: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(() => valuesFromWedding(wedding));
  const [editable, setEditable] = useState(initiallyEditable);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<WeddingSettingsFieldName, string>>
  >({});

  function updateValue(key: keyof WeddingSettingsFormValues, value: string) {
    setFormError(null);
    const nextValues = { ...values, [key]: value };
    const field = fieldNameByValueKey[key];
    setValues(nextValues);

    if (fieldErrors[field]) {
      const nextError = changedWeddingFieldError(
        nextValues,
        key,
        minimumWeddingDate,
      );
      setFieldErrors((current) => {
        if (!current[field]) return current;

        const next = { ...current };
        if (nextError) next[field] = nextError;
        else delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || pending) return;

    setFormError(null);
    setFieldErrors({});

    const result = updateWeddingSchema.safeParse(
      buildWeddingUpdateInput(values),
    );

    if (!result.success) {
      const nextErrors: Partial<Record<WeddingSettingsFieldName, string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as WeddingSettingsFieldName;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }

      setFieldErrors(nextErrors);
      return;
    }

    if (result.data.mainWeddingDate < minimumWeddingDate) {
      setFieldErrors({
        mainWeddingDate: "Choose today or a future wedding date.",
      });
      return;
    }

    setPending(true);

    try {
      const response = await fetchWithTimeout("/api/v1/wedding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = (await response.json()) as UpdateWeddingResponse;

      if (!response.ok) {
        if (body.error?.code === "CONFLICT") setEditable(false);

        const serverFieldErrors = body.error?.details?.fieldErrors;
        setFieldErrors(
          Object.fromEntries(
            Object.entries(serverFieldErrors ?? {}).map(([key, messages]) => [
              key,
              messages?.[0],
            ]),
          ) as Partial<Record<WeddingSettingsFieldName, string>>,
        );
        setFormError(body.error?.message ?? "We couldn't save your changes.");
        return;
      }

      if (body.data?.wedding) {
        router.replace("/app?notice=wedding-details-updated");
        return;
      }

      setFormError("We couldn't confirm that your changes were saved.");
    } catch (error) {
      setFormError(
        error instanceof RequestTimeoutError
          ? "Vivaahly took too long to respond. Please try again shortly."
          : "We couldn't reach Vivaahly. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const fieldsDisabled = !editable || pending;

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="pointer-events-none absolute -left-20 -top-16 -z-10 h-72 w-72 rounded-full bg-secondary-container/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-44 -z-10 h-80 w-80 rounded-full bg-primary-fixed/20 blur-3xl" />

      <div className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-label-sm font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          Your wedding workspace
        </p>
        <h1 className="mt-4 font-headline-lg text-[2.45rem] leading-[1.08] tracking-tight text-on-surface sm:text-[3.25rem]">
          Edit your wedding details
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg leading-8 text-on-surface-variant">
          Update the essential information for your wedding workspace.
        </p>
      </div>

      {!editable ? (
        <div className="mb-5 rounded-2xl bg-secondary-fixed p-4 text-on-secondary-fixed" role="status">
          <p className="text-title-md font-semibold">Wedding details are read-only</p>
          <p className="mt-1 text-body-sm text-on-secondary-fixed-variant">
            Wedding details can no longer be edited because the wedding date has passed.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-[0_18px_45px_rgba(44,28,33,0.08)] sm:p-8 md:p-10"
      >
        {formError ? (
          <div className="mb-6 rounded-xl bg-error-container p-4 text-body-sm text-on-error-container" role="alert">
            <p className="font-semibold">We couldn&apos;t save your changes</p>
            <p className="mt-1">{formError}</p>
          </div>
        ) : null}

        <FormSection title="The Couple" translation="वधू & वर">
          <div className="mb-5 rounded-xl bg-surface-container-low p-4 text-body-sm leading-6 text-on-surface-variant">
            English names are required. Marathi names can be added now or later for the bilingual wedding experience.
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="bride-name-en" label="Bride's name in English" required error={fieldErrors["couple.bride.name.en"]}>
              <input id="bride-name-en" value={values.brideNameEn} onChange={(event) => updateValue("brideNameEn", event.target.value)} disabled={fieldsDisabled} maxLength={100} autoComplete="off" placeholder="Priya Sharma" aria-invalid={Boolean(fieldErrors["couple.bride.name.en"])} className={inputClassName} />
            </FormField>
            <FormField id="bride-name-mr" label="Bride's name in Marathi" optional error={fieldErrors["couple.bride.name.mr"]}>
              <input id="bride-name-mr" lang="mr" value={values.brideNameMr} onChange={(event) => updateValue("brideNameMr", event.target.value)} disabled={fieldsDisabled} maxLength={100} autoComplete="off" placeholder="प्रिया शर्मा" className={inputClassName} />
            </FormField>
            <FormField id="groom-name-en" label="Groom's name in English" required error={fieldErrors["couple.groom.name.en"]}>
              <input id="groom-name-en" value={values.groomNameEn} onChange={(event) => updateValue("groomNameEn", event.target.value)} disabled={fieldsDisabled} maxLength={100} autoComplete="off" placeholder="Deepesh Patil" aria-invalid={Boolean(fieldErrors["couple.groom.name.en"])} className={inputClassName} />
            </FormField>
            <FormField id="groom-name-mr" label="Groom's name in Marathi" optional error={fieldErrors["couple.groom.name.mr"]}>
              <input id="groom-name-mr" lang="mr" value={values.groomNameMr} onChange={(event) => updateValue("groomNameMr", event.target.value)} disabled={fieldsDisabled} maxLength={100} autoComplete="off" placeholder="दीपेश पाटील" className={inputClassName} />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Wedding Details" translation="समारंभ तपशील" className="mt-9">
          <FormField id="wedding-title" label="Wedding title" required error={fieldErrors["title.en"]}>
              <input id="wedding-title" value={values.titleEn} onChange={(event) => updateValue("titleEn", event.target.value)} disabled={fieldsDisabled} maxLength={140} placeholder="Our Forever Begins" aria-invalid={Boolean(fieldErrors["title.en"])} className={inputClassName} />
              <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">This title is independent from the couple names and will appear across your wedding workspace and invitations.</p>
          </FormField>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField id="wedding-date" label="Main wedding date" required error={fieldErrors.mainWeddingDate}>
              <input id="wedding-date" type="date" min={minimumWeddingDate} value={values.mainWeddingDate} onChange={(event) => updateValue("mainWeddingDate", event.target.value)} disabled={fieldsDisabled} aria-invalid={Boolean(fieldErrors.mainWeddingDate)} className={inputClassName} />
            </FormField>
            <FormField id="wedding-timezone" label="Timezone" required error={fieldErrors.timezone}>
              <select id="wedding-timezone" value={values.timezone} onChange={(event) => updateValue("timezone", event.target.value)} disabled={fieldsDisabled} className={inputClassName}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST · UTC+05:30)</option>
              </select>
              <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Event times and schedules will use this timezone.</p>
            </FormField>
          </div>

          <div className="mt-5">
            <FormField id="wedding-city" label="Wedding city or location" required error={fieldErrors["primaryVenue.city.en"]}>
              <input id="wedding-city" value={values.cityEn} onChange={(event) => updateValue("cityEn", event.target.value)} disabled={fieldsDisabled} maxLength={120} placeholder="Pune, Maharashtra" aria-invalid={Boolean(fieldErrors["primaryVenue.city.en"])} className={inputClassName} />
              <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Enter the primary city or town. You can add the exact venue and address later.</p>
            </FormField>
          </div>
        </FormSection>

        <div className="mt-9 flex flex-col items-center gap-3">
          <div className="flex w-full flex-col-reverse items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <button type="button" onClick={() => router.push("/app")} className="min-h-12 w-full rounded-xl px-6 py-3 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container sm:w-auto">
              {editable ? "Cancel" : "Back to workspace"}
            </button>
            {editable ? (
              <button type="submit" disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-56">
                {pending ? <Spinner /> : null}
                {pending ? "Saving changes…" : "Save changes"}
                {!pending ? <ArrowIcon /> : null}
              </button>
            ) : null}
          </div>
          {editable ? <p className="text-center text-body-sm text-on-surface-variant">Your updated details will appear throughout your wedding workspace.</p> : null}
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, translation, className = "", children }: { title: string; translation: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={className}>
      <legend className="mb-5 flex w-full items-center gap-3 text-headline-sm font-semibold text-on-surface">
        <span>{title}</span>
        <span className="text-body-sm font-normal text-on-surface-variant">· {translation}</span>
        <span className="h-px flex-1 bg-outline-variant/70" />
      </legend>
      {children}
    </fieldset>
  );
}

function FormField({ id, label, required = false, optional = false, error, children }: { id: string; label: string; required?: boolean; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between gap-3 text-label-md font-semibold text-on-surface">
        <span>{label}{required ? <span className="text-error"> *</span> : null}</span>
        {optional ? <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">Optional</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[12px] leading-5 text-error" role="alert">{error}</p> : null}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
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
