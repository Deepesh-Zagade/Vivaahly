import { Icon } from "../icon";

// Static product illustration adapted from the approved Stitch homepage.
export function WorkspaceSection() {
  return (
    <section
      id="workspace"
      aria-labelledby="workspace-heading"
      className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-20 lg:py-28"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2
          id="workspace-heading"
          className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
        >
          One wedding.{" "}
          <span className="font-headline-lg italic font-normal text-primary">
            One shared workspace.
          </span>
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Give both sides of the family one structured home to view what is
          happening, what needs to be done, and who is responsible.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-5">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Family Roles &amp; Event Leads
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  4 Active Coordinators
                </span>
              </div>
              <button
                type="button"
                disabled
                className="font-label-sm text-label-sm text-primary flex items-center gap-1 hover:underline"
              >
                <Icon name="person_add" className=" text-[16px]" /> Invite
                Family
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-title-md text-title-md">
                    DP
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface">
                      Deepesh &amp; Priya
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Bride &amp; Groom · Primary Admins
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                  Admin
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-title-md text-title-md">
                    RK
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface">
                      Rahul Kulkarni
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Brother · Lead: Sangeet Night &amp; DJ
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-medium">
                  Manager
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-title-md text-title-md">
                    SR
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface">
                      Sanjay Raste
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Uncle · Lead: Venue Setup &amp; Welcome
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-medium">
                  Manager
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-title-md text-title-md">
                    MD
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface">
                      Meera Deshmukh
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Sister · Lead: Mehendi Artists &amp; Favors
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-medium">
                  Manager
                </span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/60 mb-4">
              <div className="flex items-center gap-2">
                <Icon
                  name="splitscreen"
                  className=" text-primary text-[20px]"
                />
                <span className="font-title-md text-title-md text-on-surface">
                  Who’s handling what
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Shared assignments
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    RK
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Sangeet decoration
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                      Rahul
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-label-sm text-[11px] font-semibold shrink-0">
                  In Progress
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    SR
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Venue welcome
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                      Sanjay
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-[11px] font-semibold shrink-0">
                  Confirmed
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    MD
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      Mehendi favors
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                      Meera
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-[11px] font-semibold shrink-0">
                  Completed
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm shrink-0 font-medium">
                    DP
                  </div>
                  <div className="truncate">
                    <p className="font-title-md text-body-sm text-on-surface truncate">
                      RSVP follow-ups
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                      Deepesh
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-label-sm text-[11px] font-semibold shrink-0">
                  In Progress
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon name="calendar_month" className=" text-[24px]" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
              Every ceremony in one place
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              From the intimate home Haldi to the 300-guest Reception, configure
              independent dates, venues, schedules, dress codes, and
              requirements for each function.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
              <Icon name="assignment_ind" className=" text-[24px]" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
              Zero ambiguity across family
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Make responsibilities and upcoming tasks easy to see. Assign
              specific items to cousins, parents, or other organizers so
              everyone is confident in their responsibilities.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-4">
              <Icon name="folder_shared" className=" text-[24px]" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
              Nothing important gets buried
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Keep guest lists, event schedules, vendor contacts, and expense
              records in one clean view accessible from any smartphone or
              tablet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
