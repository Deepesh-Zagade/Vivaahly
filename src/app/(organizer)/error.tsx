"use client";

export default function OrganizerError({ reset }: { reset: () => void }) {
  return (
    <main className="organizer-page flex min-h-screen items-center bg-surface px-margin-mobile py-14 font-body-md text-on-surface md:px-margin">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-7 text-center shadow-[0_18px_45px_rgba(44,28,33,0.08)] sm:p-10">
        <p className="text-label-sm font-semibold uppercase tracking-[0.12em] text-secondary">
          Connection interrupted
        </p>
        <h1 className="mt-3 font-headline-lg text-[2.35rem] leading-tight text-on-surface">
          Your workspace is temporarily unavailable
        </h1>
        <p className="mt-3 text-body-md leading-7 text-on-surface-variant">
          Vivaahly could not connect to the database. Your wedding information
          has not been changed. Please try again shortly.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 min-h-12 rounded-xl bg-primary px-7 py-3 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
