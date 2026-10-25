import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function CultureSection() {
  return (
    <section
      id="culture"
      aria-labelledby="culture-heading"
      className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-20 lg:py-28"
    >
      <div className="max-w-3xl mb-16">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
          Designed from Culture
        </span>
        <h2
          id="culture-heading"
          className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
        >
          Built around how Indian weddings actually work.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Cultural nuance engineered into software behavior, not superficial
          visual clichés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-label-sm text-[12px] font-bold">
                01
              </span>
              <h3 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                Multiple Ceremonies as First-Class Citizens
              </h3>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed mb-4">
              Independent schedules, venues, and dress codes for every
              ritual—never crammed into a single schedule.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-label-sm pb-1.5 border-b border-outline-variant/30 text-on-surface-variant">
              <span className="font-semibold text-primary uppercase tracking-wider">
                Multi-Ritual Pipeline
              </span>
              <span className="">5 Events Active</span>
            </div>
            <div className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-1.5 pt-1">
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mb-0.5"></span>
                <p className="font-title-md text-[11px] text-on-surface truncate">
                  Haldi
                </p>
                <span className="font-label-sm text-[10px] text-on-surface-variant block">
                  12 Feb
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mb-0.5"></span>
                <p className="font-title-md text-[11px] text-on-surface truncate">
                  Mehendi
                </p>
                <span className="font-label-sm text-[10px] text-on-surface-variant block">
                  12 Feb
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-primary/50 text-center shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mb-0.5"></span>
                <p className="font-title-md text-[11px] text-primary truncate font-semibold">
                  Sangeet
                </p>
                <span className="font-label-sm text-[10px] text-primary block">
                  13 Feb
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block mb-0.5"></span>
                <p className="font-title-md text-[11px] text-on-surface truncate">
                  Vivaah
                </p>
                <span className="font-label-sm text-[10px] text-on-surface-variant block">
                  14 Feb
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-label-sm text-[12px] font-bold">
                02
              </span>
              <h3 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                Different Guests for Different Events
              </h3>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed mb-4">
              Tailor invite access per circle so attendees only see ceremonies
              meant for them—avoiding mix-ups.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-label-sm pb-1.5 border-b border-outline-variant/30 text-on-surface-variant">
              <span className="font-semibold text-primary uppercase tracking-wider">
                Ceremony Access Matrix
              </span>
              <span className="text-emerald-700 font-medium">
                Restricted View
              </span>
            </div>
            <div className="space-y-1.5 pt-0.5 font-body-sm text-[11px]">
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-1">
                <span className="font-title-md text-on-surface truncate text-[11px]">
                  Sharma Family (Relatives)
                </span>
                <div className="flex gap-1 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium">
                    Haldi ✓
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium">
                    Vivaah ✓
                  </span>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-1">
                <span className="font-title-md text-on-surface truncate text-[11px]">
                  Tech Colleagues (Friends)
                </span>
                <div className="flex gap-1 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium">
                    Sangeet ✓
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px]">
                    Vivaah —
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-label-sm text-[12px] font-bold">
                03
              </span>
              <h3 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                Multi-Generational Family RSVPs
              </h3>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed mb-4">
              One family head can RSVP for their full household, choosing an
              attending count for each invited ceremony.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-label-sm pb-1.5 border-b border-outline-variant/30 text-on-surface-variant">
              <span className="font-semibold text-primary uppercase tracking-wider">
                Household RSVP
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
              <div>
                <p className="font-title-md text-[12px] text-on-surface">
                  Kulkarni Household
                </p>
                <div className="flex gap-1 mt-1">
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px]">
                    Haldi: 3
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px]">
                    Wedding: 4
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-lg border border-outline-variant/40 text-[12px]">
                <span className="text-on-surface-variant font-bold cursor-default">
                  −
                </span>
                <span className="font-semibold text-primary px-1">4</span>
                <span className="text-on-surface-variant font-bold cursor-default">
                  +
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-label-sm text-[12px] font-bold">
                04
              </span>
              <h3 className="font-headline-sm text-[18px] text-on-surface font-semibold">
                English + Marathi
              </h3>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed mb-4">
              Guests can read invitations and ceremony schedules in English or
              Marathi with a single tap.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/30">
              <span className="font-label-sm text-[11px] font-semibold text-primary uppercase tracking-wider">
                Guest Interface
              </span>
              <div className="inline-flex items-center bg-surface-container-high rounded-full p-0.5 text-[10px] font-semibold border border-outline-variant/50">
                <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary">
                  English
                </span>
                <span className="px-2 py-0.5 text-on-surface-variant">
                  मराठी
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between">
              <div className="truncate">
                <p className="font-headline-sm text-[12px] italic text-primary truncate">
                  निमंत्रण पत्रिका · Wedding Invitation
                </p>
                <p className="font-body-sm text-[10px] text-on-surface-variant truncate">
                  मुहूर्त व विवाह सोहळा तपशील (Ritual Timings)
                </p>
              </div>
              <Icon
                name="translate"
                className=" text-[16px] text-primary shrink-0 ml-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
