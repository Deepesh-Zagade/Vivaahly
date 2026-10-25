import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function GuestExperienceSection() {
  return (
    <section
      id="guest-experience"
      aria-labelledby="guest-experience-heading"
      className="w-full bg-surface-container-low py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
            For Every Attendee
          </span>
          <h2
            id="guest-experience-heading"
            className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
          >
            Beautiful for guests.{" "}
            <span className="font-headline-lg italic font-normal text-primary">
              Effortless
            </span>{" "}
            for you.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            No mandatory app download. Your guests receive a bespoke mobile web
            portal tailored exclusively to the rituals they are invited to
            attend.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-[32px] p-6 shadow-md flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50 mb-6">
                <span className="break-all font-label-sm text-label-sm text-on-surface-variant">
                  vivaahly.com/w/deepesh-priya
                </span>
                <div className="flex shrink-0 whitespace-nowrap items-center gap-1 text-[11px] font-semibold bg-surface-container px-2 py-0.5 rounded-full">
                  <span className="text-primary">EN</span> |{" "}
                  <span className="text-on-surface-variant">मराठी</span>
                </div>
              </div>
              <div className="text-center pt-4">
                <span className="font-headline-sm text-headline-sm italic text-primary block mb-2">
                  Deepesh &amp; Priya
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block mb-6">
                  Celebrating Together
                </span>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50 text-left">
                  <p className="font-title-md text-title-md text-on-surface mb-1">
                    Namaste Sharma Family,
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    We joyfully invite you to celebrate our union across Pune on
                    12-14 February 2027.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <span className="font-label-sm text-label-sm text-secondary">
                Swipe to view your schedule ↓
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border-2 border-primary/40 rounded-[32px] p-6 shadow-lg flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50 mb-4">
                <span className="font-title-md text-title-md text-on-surface">
                  Your Schedule
                </span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  4 Events
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-surface-container-low border-l-4 border-primary">
                  <div className="flex justify-between font-title-md text-title-md text-on-surface">
                    <span className="">Sangeet Night</span>
                    <span className="text-[12px] font-normal text-on-surface-variant">
                      13 Feb · 7 PM
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Royal Orchid Ballroom · Indo-Western
                  </p>
                  <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 mt-1">
                    <Icon name="map" className=" text-[14px]" /> Open Venue Map
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border-l-4 border-secondary">
                  <div className="flex justify-between font-title-md text-title-md text-on-surface">
                    <span className="">Vivaah Ceremony</span>
                    <span className="text-[12px] font-normal text-on-surface-variant">
                      14 Feb · 10:30 AM
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Shubham Mandap · Traditional Silk
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border-l-4 border-tertiary-container">
                  <div className="flex justify-between font-title-md text-title-md text-on-surface">
                    <span className="">Reception</span>
                    <span className="text-[12px] font-normal text-on-surface-variant">
                      14 Feb · 7:30 PM
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Grand Emerald Lawn · Formal
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Addresses &amp; dress codes included
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-[32px] p-6 shadow-md flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50 mb-4">
                <span className="font-title-md text-title-md text-on-surface">
                  Respond for Family
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  5 Invited
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                    Attending Count:
                  </span>
                  <div className="flex gap-2">
                    <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-title-md">
                      1
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-title-md">
                      2
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-title-md">
                      3
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-title-md">
                      4
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-title-md">
                      5
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                    Your event responses:
                  </span>
                  <div className="space-y-1.5 text-[13px]">
                    <div className="p-2 rounded-lg bg-surface-container-low flex justify-between">
                      <span className="">Sangeet</span>
                      <span className="font-semibold text-primary">
                        3 attending
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low flex justify-between">
                      <span className="">Wedding</span>
                      <span className="font-semibold text-primary">
                        5 attending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-sm"
            >
              Confirm RSVP for 5 Guests
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
