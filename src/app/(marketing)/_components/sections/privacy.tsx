import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function PrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-20 lg:py-28"
    >
      <div className="max-w-3xl mb-16">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
          Thoughtful Governance
        </span>
        <h2
          id="privacy-heading"
          className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
        >
          Wedding details stay strictly with the people they’re meant for.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Indian weddings involve sensitive finances, mixed guest circles, and
          private family phone numbers. We keep them separate.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Icon name="lock" className=" text-[22px]" />
          </div>
          <h3 className="font-title-md text-title-md text-on-surface mb-2">
            Private Planning Workspace
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Expense records, vendor details, guest contacts, and internal tasks
            are only available to your authorized wedding organizers.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
            <Icon name="visibility_off" className=" text-[22px]" />
          </div>
          <h3 className="font-title-md text-title-md text-on-surface mb-2">
            Personalized Guest Visibility
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Guests only see ceremony times and locations for the events they
            have been invited to attend. No embarrassing group chat mix-ups.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant">
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-4">
            <Icon name="shield" className=" text-[22px]" />
          </div>
          <h3 className="font-title-md text-title-md text-on-surface mb-2">
            Separate Media Hub
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Anyone with your shared media link can view and contribute memories,
            without accessing organizer records or personalized invitations.
          </p>
        </div>
      </div>
    </section>
  );
}
