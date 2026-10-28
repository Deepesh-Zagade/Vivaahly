import Link from "next/link";

// Static product illustration adapted from the approved Stitch homepage.
export function ClosingSection({
  hasOrganizerSession,
}: {
  hasOrganizerSession: boolean;
}) {
  return (
    <section
      id="start-planning"
      aria-labelledby="start-planning-heading"
      className="w-full bg-primary text-on-primary py-24 lg:py-32"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin text-center">
        <div className="max-w-3xl mx-auto">
          <h2
            id="start-planning-heading"
            className="font-display-lg text-display-lg text-on-primary tracking-tight mb-6"
          >
            Less coordination.{" "}
            <span className="font-headline-lg italic font-normal text-tertiary-fixed">
              More celebration.
            </span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary/80 mb-10 leading-relaxed max-w-xl mx-auto">
            Bring your family, plans, schedules, and wedding details together in
            one calm workspace with Vivaahly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href={hasOrganizerSession ? "/app" : "/sign-up"}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-surface-container-lowest text-primary hover:bg-white font-label-md text-label-md px-8 py-4 rounded-xl transition-all shadow-md font-semibold"
            >
              {hasOrganizerSession
                ? "Go to your workspace"
                : "Start planning your wedding"}
            </Link>
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center border border-on-primary/30 text-on-primary hover:bg-on-primary/10 font-label-md text-label-md px-7 py-4 rounded-xl transition-all"
              href="#guest-experience"
            >
              See sample wedding
            </a>
          </div>
          <p className="font-body-sm text-body-sm text-on-primary/60">
            Made for Indian weddings · Designed for the whole family
          </p>
        </div>
      </div>
    </section>
  );
}
