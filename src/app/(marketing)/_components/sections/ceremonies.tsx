import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function CeremoniesSection() {
  return (
    <section
      id="ceremonies"
      aria-labelledby="ceremonies-heading"
      className="w-full bg-surface-container py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
              Ceremony Itinerary
            </span>
            <h2
              id="ceremonies-heading"
              className="font-headline-lg text-headline-lg text-on-surface tracking-tight"
            >
              Every ceremony, exactly where it should be.
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Give every celebration its own date, venue, dress code, and guest
            list.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  12 Feb · 10:00 AM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Haldi
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                <Icon name="location_on" className=" text-[16px]" /> Home Lawn,
                Pune
              </p>
              <div className="space-y-2 py-3 border-t border-b border-outline-variant/40">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Dress Code:</span>
                  <span className="font-title-md text-on-surface">
                    Yellow &amp; Ochre
                  </span>
                </div>
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Guests:</span>
                  <span className="font-title-md text-on-surface">
                    80 Attending
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                3 tasks pending
              </span>
              <span className="text-primary font-label-sm text-label-sm">
                Manage →
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  12 Feb · 4:00 PM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Mehendi
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                <Icon name="location_on" className=" text-[16px]" /> The
                Courtyard
              </p>
              <div className="space-y-2 py-3 border-t border-b border-outline-variant/40">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Dress Code:</span>
                  <span className="font-title-md text-on-surface">
                    Mint &amp; Pastels
                  </span>
                </div>
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Guests:</span>
                  <span className="font-title-md text-on-surface">
                    120 Attending
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                All set
              </span>
              <span className="text-primary font-label-sm text-label-sm">
                Manage →
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border-2 border-primary/40 p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  13 Feb · 7:00 PM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Sangeet Night
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                <Icon name="location_on" className=" text-[16px]" /> Royal
                Orchid Ballroom
              </p>
              <div className="space-y-2 py-3 border-t border-b border-outline-variant/40">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Dress Code:</span>
                  <span className="font-title-md text-on-surface">
                    Indo-Western
                  </span>
                </div>
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Guests:</span>
                  <span className="font-title-md text-on-surface">
                    210 Attending
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary bg-primary-fixed/50 px-2 py-0.5 rounded font-semibold">
                5 sound tasks
              </span>
              <span className="text-primary font-label-sm text-label-sm">
                Manage →
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  14 Feb · 10:30 AM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Vivaah Ritual
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                <Icon name="location_on" className=" text-[16px]" /> Shubham
                Mandap
              </p>
              <div className="space-y-2 py-3 border-t border-b border-outline-variant/40">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Dress Code:</span>
                  <span className="font-title-md text-on-surface">
                    Traditional Silk
                  </span>
                </div>
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Guests:</span>
                  <span className="font-title-md text-on-surface">
                    320 Attending
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded">
                2 tasks pending
              </span>
              <span className="text-primary font-label-sm text-label-sm">
                Manage →
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  14 Feb · 7:30 PM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Reception
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                <Icon name="location_on" className=" text-[16px]" /> Grand
                Emerald Lawn
              </p>
              <div className="space-y-2 py-3 border-t border-b border-outline-variant/40">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Dress Code:</span>
                  <span className="font-title-md text-on-surface">
                    Black Tie / Formal
                  </span>
                </div>
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Guests:</span>
                  <span className="font-title-md text-on-surface">
                    320 Attending
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                4 tasks pending
              </span>
              <span className="text-primary font-label-sm text-label-sm">
                Manage →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
