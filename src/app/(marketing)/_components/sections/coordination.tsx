import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function CoordinationSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="w-full bg-surface-container-low py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="max-w-3xl mb-16">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
            The Modern Wedding Reality
          </span>
          <h2
            id="how-it-works-heading"
            className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
          >
            Your wedding shouldn’t need twelve WhatsApp groups.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Guest lists in loose spreadsheets. Tasks trapped in endless family
            group chats. Vendor numbers buried in phone logs. Expenses scrawled
            on paper napkins. Vivaahly brings quiet order to the glorious
            madness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm opacity-80 -rotate-1">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1 font-title-md text-title-md">
                <Icon
                  name="table_chart"
                  className=" text-rose-800 text-[18px]"
                />
                <span className="break-all">Guestlist_v4_final.xlsx</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                &quot;Did Chacha confirm for 3 or 5?&quot;
              </p>
            </div>
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm opacity-90 rotate-2">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1 font-title-md text-title-md">
                <Icon name="chat" className=" text-emerald-800 text-[18px]" />
                WhatsApp (18 Members)
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                240 unread messages about safa colors
              </p>
            </div>
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm opacity-75 -rotate-2">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1 font-title-md text-title-md">
                <Icon name="mic" className=" text-amber-800 text-[18px]" />
                Voice Note from Mami
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                &quot;What time does Sangeet start?&quot;
              </p>
            </div>
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm opacity-85 rotate-1">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1 font-title-md text-title-md">
                <Icon
                  name="contact_phone"
                  className=" text-sky-800 text-[18px]"
                />
                Pandit Ji Contact
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Saved in Papaji&apos;s old phone notes
              </p>
            </div>
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm opacity-80 rotate-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1 font-title-md text-title-md">
                <Icon name="payments" className=" text-stone-700 text-[18px]" />
                Notebook of Cash Advances
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                &quot;Who paid the ₹20,000 brass band token?&quot;
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-center py-4 lg:py-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="arrow_forward" className=" text-[28px]" />
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-md">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/60">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <Icon name="hub" className=" text-[20px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  The Single Source of Truth
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Always current, shared by the entire family
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-3">
                <Icon
                  name="check_circle"
                  className=" text-emerald-700 text-[20px] shrink-0 mt-0.5"
                />
                <span className="font-body-md text-body-md text-on-surface">
                  <strong className="font-title-md">Single Guest List:</strong>{" "}
                  Attendance organized by ceremony
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon
                  name="check_circle"
                  className=" text-emerald-700 text-[20px] shrink-0 mt-0.5"
                />
                <span className="font-body-md text-body-md text-on-surface">
                  <strong className="font-title-md">Role Delegation:</strong>{" "}
                  Cousins, aunts, &amp; uncles know their duties
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon
                  name="check_circle"
                  className=" text-emerald-700 text-[20px] shrink-0 mt-0.5"
                />
                <span className="font-body-md text-body-md text-on-surface">
                  <strong className="font-title-md">
                    Shared Expense Ledger:
                  </strong>{" "}
                  Who paid what, when, and what’s due next
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon
                  name="check_circle"
                  className=" text-emerald-700 text-[20px] shrink-0 mt-0.5"
                />
                <span className="font-body-md text-body-md text-on-surface">
                  <strong className="font-title-md">
                    Bilingual Guest Experience:
                  </strong>{" "}
                  English &amp; Marathi updates
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
