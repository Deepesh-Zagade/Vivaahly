import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function TasksSection() {
  return (
    <section
      id="tasks"
      aria-labelledby="tasks-heading"
      className="w-full bg-surface-container-low py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="max-w-3xl mb-12">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
            Family Task Delegation
          </span>
          <h2
            id="tasks-heading"
            className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
          >
            Everyone knows what they’re responsible for.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Turn family goodwill into clear, calm ownership without making the
            wedding feel like corporate project management.
          </p>
        </div>

        <div className="space-y-3 max-w-4xl">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded border-2 border-outline mt-0.5 flex items-center justify-center shrink-0"></div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">
                  Confirm Sangeet sound &amp; lighting dry run
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1 text-primary">
                    <Icon name="person" className=" text-[16px]" /> Rahul
                    (Brother)
                  </span>
                  <span className="">·</span>
                  <span className="">Event: Sangeet</span>
                  <span className="">·</span>
                  <span className="text-amber-700 font-medium">
                    Due: Tomorrow, 2:00 PM
                  </span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm self-start sm:self-center font-medium">
              In Progress
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75">
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded bg-primary text-on-primary mt-0.5 flex items-center justify-center shrink-0">
                <Icon name="check" className=" text-[16px]" />
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface line-through">
                  Prepare welcome baskets for the ceremony
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Icon name="person" className=" text-[16px]" /> Pooja &amp;
                    Vikram (Cousins)
                  </span>
                  <span className="">·</span>
                  <span className="">Event: Haldi Day</span>
                  <span className="">·</span>
                  <span className="">Due: 11 Feb</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm self-start sm:self-center font-medium">
              Completed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75">
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded bg-primary text-on-primary mt-0.5 flex items-center justify-center shrink-0">
                <Icon name="check" className=" text-[16px]" />
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface line-through">
                  Confirm final ceremony attendance with the caterer
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Icon name="person" className=" text-[16px]" /> Deepesh
                    (Groom)
                  </span>
                  <span className="">·</span>
                  <span className="">Event: Vivaah</span>
                  <span className="">·</span>
                  <span className="">Headcount: 247 attending</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm self-start sm:self-center font-medium">
              Completed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded border-2 border-outline mt-0.5 flex items-center justify-center shrink-0"></div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">
                  Finalize DJ playlist for Couple Entry &amp; Parents&apos;
                  Dance
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1 text-primary">
                    <Icon name="person" className=" text-[16px]" /> Priya
                    (Bride)
                  </span>
                  <span className="">·</span>
                  <span className="">Event: Reception</span>
                  <span className="">·</span>
                  <span className="">Due: 13 Feb</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm self-start sm:self-center font-medium">
              In Progress
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded border-2 border-outline mt-0.5 flex items-center justify-center shrink-0"></div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">
                  Prepare welcome signage for the Sangeet and Reception
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1 text-secondary">
                    <Icon name="person" className=" text-[16px]" /> Sanjay Kaka
                  </span>
                  <span className="">·</span>
                  <span className="">Logistics Team</span>
                  <span className="">·</span>
                  <span className="">Due: 11 Feb</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm self-start sm:self-center font-medium">
              Not Started
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
