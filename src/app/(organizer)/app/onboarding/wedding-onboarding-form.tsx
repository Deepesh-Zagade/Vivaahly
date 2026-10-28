"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  createWeddingSchema,
  type CreateWeddingInput,
} from "@/modules/wedding/wedding.schemas";
import type {
  WeddingDto,
  WeddingMembershipDto,
} from "@/modules/wedding/wedding.types";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

type FieldName =
  | "couple.bride.name.en"
  | "couple.bride.name.mr"
  | "couple.groom.name.en"
  | "couple.groom.name.mr"
  | "title.en"
  | "mainWeddingDate"
  | "timezone"
  | "primaryVenue.city.en";

type FormValues = {
  brideNameEn: string;
  brideNameMr: string;
  groomNameEn: string;
  groomNameMr: string;
  titleEn: string;
  mainWeddingDate: string;
  timezone: string;
  cityEn: string;
};

type CreateWeddingResponse = {
  data?: {
    wedding: WeddingDto;
    membership: WeddingMembershipDto;
  };
  error?: {
    code?: string;
    message?: string;
    details?: {
      fieldErrors?: Partial<Record<FieldName, string[]>>;
    };
  };
};

const initialValues: FormValues = {
  brideNameEn: "",
  brideNameMr: "",
  groomNameEn: "",
  groomNameMr: "",
  titleEn: "",
  mainWeddingDate: "",
  timezone: "Asia/Kolkata",
  cityEn: "",
};

const inputClassName =
  "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 disabled:cursor-wait disabled:opacity-65";

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

function WeddingRingsIcon() {
  return (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="19" r="7" />
      <circle cx="20" cy="19" r="7" />
      <path d="m16 3 2.4 3.3L16 9.5l-2.4-3.2L16 3Zm-8.5 5.5h3M9 7v3m14.5-1.5h-3M22 7v3" />
    </svg>
  );
}

function SummaryIcon({ type }: { type: "date" | "location" | "role" }) {
  const path = {
    date: "M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Zm2 8h3m2 0h3m-8 4h3",
    location: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    role: "m12 3 8 3.5V12c0 5.2-8 9-8 9s-8-3.8-8-9V6.5L12 3Zm-3 9 2 2 4-4",
  }[type];

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
      <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

function titleFromNames(groom: string, bride: string) {
  const names = [groom.trim(), bride.trim()].filter(Boolean);
  return names.join(" & ");
}

function buildInput(values: FormValues): CreateWeddingInput {
  return {
    couple: {
      bride: {
        name: {
          en: values.brideNameEn,
          ...(values.brideNameMr ? { mr: values.brideNameMr } : {}),
        },
      },
      groom: {
        name: {
          en: values.groomNameEn,
          ...(values.groomNameMr ? { mr: values.groomNameMr } : {}),
        },
      },
    },
    title: { en: values.titleEn },
    mainWeddingDate: values.mainWeddingDate,
    timezone: values.timezone,
    primaryVenue: { city: { en: values.cityEn } },
  };
}

export function WeddingOnboardingForm({
  minimumWeddingDate,
}: {
  minimumWeddingDate: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [titleWasEdited, setTitleWasEdited] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [created, setCreated] = useState<CreateWeddingResponse["data"] | null>(null);
  const createdHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!created) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    createdHeadingRef.current?.focus({ preventScroll: true });
  }, [created]);

  function updateValue(key: keyof FormValues, value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (!titleWasEdited && (key === "brideNameEn" || key === "groomNameEn")) {
        next.titleEn = titleFromNames(next.groomNameEn, next.brideNameEn);
      }

      return next;
    });
  }

  function resyncTitle() {
    setTitleWasEdited(false);
    setValues((current) => ({
      ...current,
      titleEn: titleFromNames(current.groomNameEn, current.brideNameEn),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const result = createWeddingSchema.safeParse(buildInput(values));

    if (!result.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as FieldName;
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
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = (await response.json()) as CreateWeddingResponse;

      if (!response.ok) {
        if (body.error?.code === "CONFLICT") setConflict(true);

        const serverFieldErrors = body.error?.details?.fieldErrors;
        setFieldErrors(
          Object.fromEntries(
            Object.entries(serverFieldErrors ?? {}).map(([key, messages]) => [
              key,
              messages?.[0],
            ]),
          ) as Partial<Record<FieldName, string>>,
        );
        setFormError(body.error?.message ?? "We couldn't create your wedding.");
        return;
      }

      if (body.data) setCreated(body.data);
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

  if (created) {
    return (
      <WeddingCreated
        wedding={created.wedding}
        membership={created.membership}
        headingRef={createdHeadingRef}
        onContinue={() => {
          router.push("/app");
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-label-sm font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          Your wedding workspace
        </p>
        <h1 className="mt-4 font-headline-lg text-[2.45rem] leading-[1.08] tracking-tight text-on-surface sm:text-[3.25rem]">
          Let&apos;s set up your wedding
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg leading-8 text-on-surface-variant">
          Start with the essentials. You can add venues, events, guests, and all the finer details afterward.
        </p>
      </div>

      {conflict ? (
        <div className="mb-5 flex flex-col gap-4 rounded-2xl bg-secondary-fixed p-4 text-on-secondary-fixed shadow-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div>
            <p className="text-title-md font-semibold">Existing wedding found</p>
            <p className="mt-0.5 text-body-sm text-on-secondary-fixed-variant">
              Your account already belongs to an active wedding workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              router.push("/app");
              router.refresh();
            }}
            className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary"
          >
            Go to your workspace
          </button>
        </div>
      ) : null}

      {!conflict ? (
        <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-[0_18px_45px_rgba(44,28,33,0.08)] sm:p-8 md:p-10">
          {formError ? (
            <div className="mb-6 rounded-xl bg-error-container p-4 text-body-sm text-on-error-container" role="alert">
              <p className="font-semibold">We couldn&apos;t create your wedding</p>
              <p className="mt-1">{formError}</p>
            </div>
          ) : null}

          <FormSection title="The Couple" translation="वधू & वर">
            <div className="mb-5 rounded-xl bg-surface-container-low p-4 text-body-sm leading-6 text-on-surface-variant">
              English names are required. Marathi names can be added now or later for the bilingual wedding experience.
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="bride-name-en" label="Bride's name in English" required error={fieldErrors["couple.bride.name.en"]}>
                <input id="bride-name-en" value={values.brideNameEn} onChange={(event) => updateValue("brideNameEn", event.target.value)} disabled={pending} maxLength={100} autoComplete="off" placeholder="Priya Sharma" aria-invalid={Boolean(fieldErrors["couple.bride.name.en"])} className={inputClassName} />
              </FormField>
              <FormField id="bride-name-mr" label="Bride's name in Marathi" optional error={fieldErrors["couple.bride.name.mr"]}>
                <input id="bride-name-mr" lang="mr" value={values.brideNameMr} onChange={(event) => updateValue("brideNameMr", event.target.value)} disabled={pending} maxLength={100} autoComplete="off" placeholder="प्रिया शर्मा" className={inputClassName} />
              </FormField>
              <FormField id="groom-name-en" label="Groom's name in English" required error={fieldErrors["couple.groom.name.en"]}>
                <input id="groom-name-en" value={values.groomNameEn} onChange={(event) => updateValue("groomNameEn", event.target.value)} disabled={pending} maxLength={100} autoComplete="off" placeholder="Deepesh Patil" aria-invalid={Boolean(fieldErrors["couple.groom.name.en"])} className={inputClassName} />
              </FormField>
              <FormField id="groom-name-mr" label="Groom's name in Marathi" optional error={fieldErrors["couple.groom.name.mr"]}>
                <input id="groom-name-mr" lang="mr" value={values.groomNameMr} onChange={(event) => updateValue("groomNameMr", event.target.value)} disabled={pending} maxLength={100} autoComplete="off" placeholder="दीपेश पाटील" className={inputClassName} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Wedding Details" translation="समारंभ तपशील" className="mt-9">
            <FormField id="wedding-title" label="Wedding title" required error={fieldErrors["title.en"]}>
              <input id="wedding-title" value={values.titleEn} onChange={(event) => { setTitleWasEdited(true); updateValue("titleEn", event.target.value); }} disabled={pending} maxLength={140} placeholder="Deepesh & Priya" aria-invalid={Boolean(fieldErrors["title.en"])} className={inputClassName} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] leading-5 text-on-surface-variant">
                <span>This will appear across your wedding workspace and invitations.</span>
                <button type="button" onClick={resyncTitle} disabled={pending} className="font-semibold text-secondary hover:underline disabled:opacity-60">Re-sync names</button>
              </div>
            </FormField>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField id="wedding-date" label="Main wedding date" required error={fieldErrors.mainWeddingDate}>
                <input id="wedding-date" type="date" min={minimumWeddingDate} value={values.mainWeddingDate} onChange={(event) => updateValue("mainWeddingDate", event.target.value)} disabled={pending} aria-invalid={Boolean(fieldErrors.mainWeddingDate)} className={inputClassName} />
              </FormField>
              <FormField id="wedding-timezone" label="Timezone" required error={fieldErrors.timezone}>
                <select id="wedding-timezone" value={values.timezone} onChange={(event) => updateValue("timezone", event.target.value)} disabled={pending} className={inputClassName}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST · UTC+05:30)</option>
                </select>
                <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Event times and schedules will use this timezone.</p>
              </FormField>
            </div>

            <div className="mt-5">
              <FormField id="wedding-city" label="Wedding city or location" required error={fieldErrors["primaryVenue.city.en"]}>
                <input id="wedding-city" value={values.cityEn} onChange={(event) => updateValue("cityEn", event.target.value)} disabled={pending} maxLength={120} placeholder="Pune, Maharashtra" aria-invalid={Boolean(fieldErrors["primaryVenue.city.en"])} className={inputClassName} />
                <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Enter the primary city or town. You can add the exact venue and address later.</p>
              </FormField>
            </div>
          </FormSection>

          <div className="mt-9 flex flex-col items-center">
            <button type="submit" disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-64">
              {pending ? <Spinner /> : null}
              {pending ? "Creating your wedding…" : "Create wedding"}
              {!pending ? <ArrowIcon /> : null}
            </button>
            <p className="mt-3 text-center text-body-sm text-on-surface-variant">You can update these details later in workspace settings.</p>
          </div>
        </form>
      ) : null}
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

function WeddingCreated({
  wedding,
  membership,
  headingRef,
  onContinue,
}: {
  wedding: WeddingDto;
  membership: WeddingMembershipDto;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onContinue: () => void;
}) {
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${wedding.mainWeddingDate}T00:00:00.000Z`));

  return (
    <section className="mx-auto max-w-4xl text-center" aria-labelledby="wedding-created-heading">
      <p className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-label-sm font-semibold uppercase tracking-[0.12em] text-primary">
        <span className="text-secondary">✦</span> Wedding workspace ready
      </p>
      <h1 ref={headingRef} id="wedding-created-heading" tabIndex={-1} className="mt-5 font-headline-lg text-[2.55rem] leading-tight tracking-tight text-primary outline-none sm:text-[3.35rem]">
        Congratulations, {wedding.title.en}
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-body-lg leading-8 text-on-surface-variant">
        Your shared planning space is ready. You can now start adding events, organizers, and wedding details.
      </p>

      <div className="relative mt-10 overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest px-5 py-10 shadow-[0_18px_45px_rgba(44,28,33,0.09)] sm:px-10 sm:py-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-[#c5a46d]" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary"><WeddingRingsIcon /></div>
        <p className="mt-5 text-label-sm font-semibold uppercase tracking-[0.14em] text-secondary">The wedding of</p>
        <h2 className="mt-2 font-headline-lg text-[2.4rem] leading-tight text-primary sm:text-[3rem]">{wedding.title.en}</h2>
        {wedding.title.mr ? <p lang="mr" className="mt-2 text-body-md text-on-surface-variant">{wedding.title.mr} · Together with their families</p> : <p className="mt-2 text-body-md text-on-surface-variant">Together with their families</p>}

        <dl className="mt-9 grid gap-6 border-t border-outline-variant/70 pt-8 text-center sm:grid-cols-3">
          <SummaryItem icon="date" label="Ceremony date" value={formattedDate} />
          <SummaryItem icon="location" label="Wedding location" value={wedding.primaryVenue.city.en} />
          <SummaryItem icon="role" label="Organizer role" value={membership.role === "ADMIN" ? "Admin" : "Manager"} />
        </dl>
      </div>

      <button type="button" onClick={onContinue} className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-title-md font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container sm:w-auto sm:min-w-80">
        Go to wedding workspace <ArrowIcon />
      </button>
      <p className="mt-3 text-body-sm text-on-surface-variant">Private celebration space · Accessible only to invited organizers</p>
    </section>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: "date" | "location" | "role";
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex flex-col items-center gap-2.5 text-label-sm font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
        <SummaryIcon type={icon} />
        <span>{label}</span>
      </dt>
      <dd className="mt-1.5 text-title-md font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
