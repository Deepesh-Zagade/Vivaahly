import { Icon } from "../icon";
import Link from "next/link";

// Static product illustration adapted from the approved Stitch homepage.
export function HeroSection() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="relative w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Wedding planning, finally in one place
          </span>
        </div>

        <h1
          id="product-heading"
          className="font-display-lg text-display-lg text-on-surface tracking-tight mb-6"
        >
          Your wedding,{" "}
          <span className="font-headline-lg italic font-normal text-primary">
            beautifully
          </span>{" "}
          organized.
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
          Bring events, guests, RSVPs, tasks, vendors, expenses, and shared
          memories into one calm, unified workspace for the whole family.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Start planning
          </Link>
          <a
            className="w-full sm:w-auto inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-label-md px-7 py-4 rounded-xl transition-all"
            href="#how-it-works"
          >
            See how it works
          </a>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant/80">
          Built for families organizing multi-ceremony Indian celebrations
          together.
        </p>
      </div>

      <div className="mt-14 max-w-[1180px] mx-auto rounded-[24px] border border-outline-variant bg-surface-container-lowest shadow-[0_20px_50px_rgba(28,25,24,0.06)] p-6 lg:p-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-outline-variant/50 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Deepesh &amp; Priya’s Wedding
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                112 days to go
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              14 February 2027 · Pune, Maharashtra
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm border-2 border-surface-container-lowest">
                DP
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm border-2 border-surface-container-lowest">
                AS
              </div>
              <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-label-sm text-label-sm border-2 border-surface-container-lowest">
                RK
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-label-sm text-label-sm border-2 border-surface-container-lowest">
                +4
              </div>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>{" "}
              Family workspace
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-surface-container-low border-l-4 border-primary flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon name="celebration" className=" text-primary text-[22px]" />
            <div>
              <span className="font-title-md text-title-md text-on-surface">
                Next Ceremony: Sangeet Night
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant ml-2">
                Tomorrow · 7:00 PM · Royal Orchid Grand Ballroom
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-surface-container-highest rounded-lg font-label-sm text-label-sm text-on-surface font-medium">
              180 of 210 attending
            </span>
            <span className="text-primary font-label-sm text-label-sm hover:underline cursor-default flex items-center gap-1">
              View run of show →
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-md text-label-md">
                Guests &amp; RSVP
              </span>
              <Icon name="groups" className=" text-[20px] text-primary" />
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-1">
                320 invited
              </div>
              <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: "77%" }}
                ></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 block">
                247 attending · 38 awaiting response
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-md text-label-md">
                Wedding Events
              </span>
              <Icon
                name="event_available"
                className=" text-[20px] text-secondary"
              />
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-1">
                5 Events
              </div>
              <p className="font-body-sm text-body-sm text-secondary font-medium mt-1">
                Next: Sangeet tomorrow
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-1.5">
                Haldi · Mehendi · Sangeet · Wedding · Reception
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-md text-label-md">Family Tasks</span>
              <Icon
                name="checklist"
                className=" text-[20px] text-on-surface-variant"
              />
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-1">
                12 Pending
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                4 assigned to you
              </p>
              <span className="font-label-sm text-label-sm text-amber-700 mt-1 block">
                3 due this week
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-md text-label-md">Expenses</span>
              <Icon name="receipt_long" className=" text-[20px] text-primary" />
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-1">
                ₹5,80,000 recorded
              </div>
              <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: "72%" }}
                ></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 block">
                ₹4,20,000 paid · ₹1,60,000 unpaid
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          <div className="lg:col-span-7 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface">
                  RSVP Snapshot
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  Attendance by ceremony
                </span>
              </div>
              <span className="text-primary font-label-sm text-label-sm hover:underline cursor-default">
                Guest list →
              </span>
            </div>
            <div className="mt-3.5 space-y-3">
              <div className="space-y-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-title-md text-body-md text-on-surface font-medium">
                    Sangeet Night
                  </span>
                  <span className="font-label-sm text-[12px] text-on-surface-variant">
                    <strong className="font-semibold text-on-surface">
                      180
                    </strong>{" "}
                    / 210 attending · 30 awaiting ·{" "}
                    <span className="text-primary font-semibold">
                      86% confirmed
                    </span>
                  </span>
                </div>
                <div className="w-full bg-surface-dim h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "86%" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-title-md text-body-md text-on-surface font-medium">
                    Vivaah Ritual
                  </span>
                  <span className="font-label-sm text-[12px] text-on-surface-variant">
                    <strong className="font-semibold text-on-surface">
                      247
                    </strong>{" "}
                    / 320 attending · 73 awaiting ·{" "}
                    <span className="text-secondary font-semibold">
                      77% confirmed
                    </span>
                  </span>
                </div>
                <div className="w-full bg-surface-dim h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{ width: "77%" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-title-md text-body-md text-on-surface font-medium">
                    Reception
                  </span>
                  <span className="font-label-sm text-[12px] text-on-surface-variant">
                    <strong className="font-semibold text-on-surface">
                      221
                    </strong>{" "}
                    / 290 attending · 69 awaiting ·{" "}
                    <span className="text-tertiary font-semibold">
                      76% confirmed
                    </span>
                  </span>
                </div>
                <div className="w-full bg-surface-dim h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-tertiary-container h-full rounded-full"
                    style={{ width: "76%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Upcoming Tasks
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  Family action items
                </span>
              </div>
              <span className="text-primary font-label-sm text-label-sm hover:underline cursor-default">
                View all →
              </span>
            </div>
            <div className="demo-task-list space-y-2.5">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    R
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Confirm Sangeet decoration
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      Today · Rahul
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-label-sm text-[11px] font-semibold shrink-0">
                  In Progress
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    P
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Finalize photographer timeline
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      Tomorrow · Priya
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] font-semibold shrink-0">
                  Pending
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    D
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Send RSVP reminder
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      In 3 days · Deepesh
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold shrink-0">
                  Assigned
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:flex absolute -bottom-5 left-10 items-center gap-3 bg-surface-container-lowest border border-outline-variant shadow-lg px-4 py-2.5 rounded-xl z-20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <div className="font-body-sm text-body-sm">
            <span className="font-title-md text-title-md text-on-surface">
              Sharma Family · 5 attending
            </span>
            <span className="text-on-surface-variant ml-1.5 block text-[12px]">
              Haldi ✓ Sangeet ✓ Wedding ✓
            </span>
          </div>
        </div>
        <div className="hidden md:flex absolute -top-5 right-10 items-center gap-3 bg-surface-container-lowest border border-outline-variant shadow-lg px-4 py-2.5 rounded-xl z-20">
          <Icon name="receipt_long" className=" text-secondary text-[20px]" />
          <div className="font-body-sm text-body-sm">
            <span className="font-title-md text-title-md text-on-surface">
              Vendor payment recorded
            </span>
            <span className="text-on-surface-variant ml-1.5 block text-[12px]">
              ABC Decorators · ₹30,000 · Paid by Rahul
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
