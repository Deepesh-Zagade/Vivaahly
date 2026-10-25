import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function ExpensesSection() {
  return (
    <section
      id="expenses"
      aria-labelledby="expenses-heading"
      className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-20 lg:py-28"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-4">
        <div>
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
            Financial Transparency
          </span>
          <h2
            id="expenses-heading"
            className="font-headline-lg text-headline-lg text-on-surface tracking-tight"
          >
            Keep the practical side under control.
          </h2>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          See what has been spent, what is still unpaid, and who covered each
          expense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Total Recorded Expenses
          </span>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            ₹12,50,000
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Across 14 recorded vendors
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Total Paid
          </span>
          <div className="font-headline-md text-headline-md text-emerald-800">
            ₹5,80,000
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Payments recorded by your family
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Outstanding Amount
          </span>
          <div className="font-headline-md text-headline-md text-secondary">
            ₹6,70,000
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Due between 12 Feb &amp; 15 Feb
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-outline-variant flex flex-wrap gap-3 items-center justify-between">
          <span className="font-title-md text-title-md text-on-surface">
            Vendor Expenses &amp; Advances
          </span>
          <button
            type="button"
            disabled
            className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors"
          >
            <Icon name="add" className=" text-[18px]" /> Add Expense
          </button>
        </div>
        <div className="divide-y divide-outline-variant/40">
          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="local_florist" className=" text-[20px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-title-md text-on-surface">
                    Stage &amp; Floral Setup
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    Sangeet &amp; Vivaah
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Royal Florals Pune · Lead: Amit Sharma
                </p>
                <p className="font-body-sm text-body-sm text-secondary mt-1">
                  Advance ₹50,000 paid by Rahul Kulkarni ·{" "}
                  <span className="underline cursor-default">View Receipt</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:justify-end gap-6">
              <div className="text-right">
                <span className="font-title-md text-title-md text-on-surface">
                  ₹1,50,000
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block">
                  Balance: ₹1,00,000
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm font-semibold">
                Paid Partial
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Icon name="restaurant" className=" text-[20px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-title-md text-on-surface">
                    Catering &amp; Live Chaat Counters
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    All 5 Events
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Rasoi Caterers Pune · 320 plates guaranteed
                </p>
                <p className="font-body-sm text-body-sm text-secondary mt-1">
                  Advance ₹2,00,000 paid by Groom&apos;s Father
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:justify-end gap-6">
              <div className="text-right">
                <span className="font-title-md text-title-md text-on-surface">
                  ₹4,20,000
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block">
                  Balance: ₹2,20,000
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm font-semibold">
                Paid Partial
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                <Icon name="photo_camera" className=" text-[20px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-title-md text-on-surface">
                    Candid &amp; Traditional Photography
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    All Ceremonies
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Luminary Moments Studio · 3 Cinematographers + 2 Candid
                </p>
                <p className="font-body-sm text-body-sm text-emerald-700 mt-1">
                  Full 100% advance deposit settled
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:justify-end gap-6">
              <div className="text-right">
                <span className="font-title-md text-title-md text-on-surface">
                  ₹1,80,000
                </span>
                <span className="font-body-sm text-body-sm text-emerald-700 block">
                  Fully Settled
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                Completed
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <Icon name="music_note" className=" text-[20px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-title-md text-on-surface">
                    Sound, DJ &amp; Dhol Artists
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    Sangeet &amp; Baraat
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Beats by Rohan · Sound check booked
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:justify-end gap-6">
              <div className="text-right">
                <span className="font-title-md text-title-md text-on-surface">
                  ₹45,000
                </span>
                <span className="font-body-sm text-body-sm text-secondary block">
                  Due upon sound-check
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                Pending Payment
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
