"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  getOrganizerPasswordError,
  ORGANIZER_PASSWORD_MAX_LENGTH,
  ORGANIZER_PASSWORD_MIN_LENGTH,
} from "@/modules/auth/password-policy";

type AuthMode = "sign-in" | "sign-up";
type FieldName = "name" | "email" | "password";

type ErrorResponse = {
  error?: {
    message?: string;
    details?: {
      fieldErrors?: Partial<Record<FieldName, string[]>>;
    };
  };
};

function MailIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-3 3 3 3m-6 0 3 3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.9-4 3.4-6 7.5-6s6.6 2 7.5 6" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {hidden ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
          <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5.5 0 9 5 9 8a9.8 9.8 0 0 1-2 3.6M6.6 6.6C4.3 8.1 3 10.4 3 12c0 3 3.5 8 9 8 1.4 0 2.7-.3 3.8-.8" />
        </>
      ) : (
        <>
          <path d="M3 12c0-3 3.5-8 9-8s9 5 9 8-3.5 8-9 8-9-5-9-8Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

const inputClassName =
  "w-full rounded-xl border border-transparent bg-surface-container-low py-3 pl-11 pr-4 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/25 disabled:cursor-wait disabled:opacity-70";

export function AuthForm({ mode, registered = false }: { mode: AuthMode; registered?: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string[]>>>({});
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      ...(isSignUp ? { name: String(form.get("name") ?? "") } : {}),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    if (isSignUp) {
      const passwordError = getOrganizerPasswordError(payload.password);

      if (passwordError) {
        setFieldErrors({ password: [passwordError] });
        const passwordInput = event.currentTarget.elements.namedItem("password");
        if (passwordInput instanceof HTMLInputElement) passwordInput.focus();
        return;
      }
    }

    setPending(true);

    try {
      const response = await fetch(
        isSignUp ? "/api/v1/auth/register" : "/api/v1/auth/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = (await response.json()) as ErrorResponse;
        setFieldErrors(result.error?.details?.fieldErrors ?? {});
        setFormError(result.error?.message ?? "We could not complete that request.");
        return;
      }

      if (isSignUp) {
        router.push("/sign-in?registered=1");
      } else {
        router.push("/app");
        router.refresh();
      }
    } catch {
      setFormError("We could not reach Vivaahly. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function fieldError(name: FieldName) {
    return fieldErrors[name]?.[0];
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="rounded-2xl border border-surface-container-highest bg-surface-container-lowest p-6 shadow-[0_12px_32px_rgba(44,28,33,0.10)] sm:p-8 md:p-10" aria-labelledby="auth-heading">
        <div className="mb-6 text-center">
          <h1 id="auth-heading" className="font-headline-lg text-[2.35rem] leading-tight tracking-tight text-on-surface sm:text-headline-lg">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {isSignUp
              ? "Start organizing your wedding with the people you trust."
              : "Sign in to continue planning your wedding."}
          </p>
        </div>

        {registered ? (
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-body-sm text-emerald-900" role="status">
            Your account is ready. Sign in to continue.
          </div>
        ) : null}

        {formError ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container" role="alert">
            <span aria-hidden="true" className="mt-0.5 font-semibold text-error">!</span>
            <span>{formError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isSignUp ? (
            <AuthField
              id="organizer-name"
              name="name"
              label="Your name"
              type="text"
              autoComplete="name"
              placeholder="Rahul Sharma"
              icon={<UserIcon />}
              error={fieldError("name")}
              disabled={pending}
              minLength={2}
              maxLength={100}
            />
          ) : null}

          <AuthField
            id="organizer-email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="rahul@example.com"
            icon={<MailIcon />}
            error={fieldError("email")}
            disabled={pending}
            maxLength={254}
            inputMode="email"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <label className="text-label-md font-semibold text-on-surface" htmlFor="organizer-password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="inline-flex items-center gap-1 text-label-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
                aria-controls="organizer-password"
                aria-pressed={showPassword}
              >
                <EyeIcon hidden={showPassword} />
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-outline">
                <KeyIcon />
              </span>
              <input
                id="organizer-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="Enter your password"
                required
                minLength={isSignUp ? ORGANIZER_PASSWORD_MIN_LENGTH : 1}
                maxLength={ORGANIZER_PASSWORD_MAX_LENGTH}
                disabled={pending}
                aria-invalid={Boolean(fieldError("password"))}
                aria-describedby={fieldError("password") ? "organizer-password-error" : isSignUp ? "organizer-password-help" : undefined}
                className={`${inputClassName} pr-4 ${fieldError("password") ? "border-error bg-error-container/20" : ""}`}
              />
            </div>
            {fieldError("password") ? (
              <p id="organizer-password-error" className="pl-1 text-[12px] leading-5 text-error">
                {fieldError("password")}
              </p>
            ) : isSignUp ? (
              <p id="organizer-password-help" className="pl-1 text-[12px] leading-5 text-on-surface-variant">
                Use at least 12 characters. Use single spaces between words; do not begin or end with a space.
              </p>
            ) : null}
          </div>

          {isSignUp ? (
            <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-[12px] leading-5 text-on-surface-variant">
              Check your email carefully. Vivaahly will use it for future account recovery.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3.5 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
          >
            {pending ? <Spinner /> : null}
            <span>
              {pending
                ? isSignUp
                  ? "Creating your account..."
                  : "Signing in..."
                : isSignUp
                  ? "Create your account"
                  : "Sign in"}
            </span>
            {!pending ? <ArrowIcon /> : null}
          </button>
        </form>

        <div className="mt-6 border-t border-surface-container-highest pt-5 text-center">
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="inline-flex items-center gap-1 text-label-md font-semibold text-primary no-underline transition-colors hover:text-primary-container"
          >
            {isSignUp ? "Already have an account? Sign in" : "New to Vivaahly? Start planning"}
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

type AuthFieldProps = {
  id: string;
  name: FieldName;
  label: string;
  type: "email" | "text";
  autoComplete: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  disabled: boolean;
  minLength?: number;
  maxLength: number;
  inputMode?: "email";
};

function AuthField({
  id,
  name,
  label,
  type,
  autoComplete,
  placeholder,
  icon,
  error,
  disabled,
  minLength,
  maxLength,
  inputMode,
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label className="block text-label-md font-semibold text-on-surface" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-outline">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClassName} ${error ? "border-error bg-error-container/20" : ""}`}
        />
      </div>
      {error ? (
        <p id={errorId} className="pl-1 text-[12px] leading-5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
