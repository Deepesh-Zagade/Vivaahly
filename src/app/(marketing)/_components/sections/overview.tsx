import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function OverviewSection() {
  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="w-full bg-surface-container-low py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
            Everything Interconnected
          </span>
          <h2
            id="overview-heading"
            className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
          >
            One place for the whole wedding.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            From a family’s Sangeet RSVP to a cousin’s assigned task, keep the
            details connected around one wedding.
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon name="event" className=" text-primary text-[28px] mb-2" />
              <span className="font-title-md text-title-md text-on-surface block">
                5 Ceremonies
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Timelines &amp; Venues
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon name="people" className=" text-primary text-[28px] mb-2" />
              <span className="font-title-md text-title-md text-on-surface block">
                Guest Matrix
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Event-by-event attendance
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="mark_email_read"
                className=" text-primary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                RSVP Engine
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Per-event family responses
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="task_alt"
                className=" text-primary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                Family Tasks
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Assigned ownership
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="storefront"
                className=" text-secondary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                14 Vendors
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Direct contacts &amp; POCs
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="currency_rupee"
                className=" text-secondary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                Expense Ledger
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                ₹ Advances &amp; dues
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="smartphone"
                className=" text-secondary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                Guest Portal
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                English / मराठी
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <Icon
                name="photo_library"
                className=" text-secondary text-[28px] mb-2"
              />
              <span className="font-title-md text-title-md text-on-surface block">
                Media Hub
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Zero-friction QR photo drop
              </span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-2">
            <span className="">
              One shared workspace, on mobile, tablet, and desktop.
            </span>
            <span className="text-primary font-semibold">
              Everything in one place.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
