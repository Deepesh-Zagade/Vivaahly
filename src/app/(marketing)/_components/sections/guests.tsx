// Static product illustration adapted from the approved Stitch homepage.
export function GuestsSection() {
  return (
    <section
      id="guests"
      aria-labelledby="guests-heading"
      className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-20 lg:py-28"
    >
      <div className="max-w-3xl mb-12">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
          Guest Logistics
        </span>
        <h2
          id="guests-heading"
          className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4"
        >
          Know who’s coming. To every single event.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Indian weddings don’t invite everyone to everything. Invite different
          groups to specific ceremonies and track attendance separately for each
          event.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-outline-variant flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-low/50">
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              disabled
              className="w-full min-w-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md sm:w-auto sm:px-3.5"
            >
              All Guests (320)
            </button>
            <button
              type="button"
              disabled
              className="w-full min-w-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md sm:w-auto sm:px-3.5"
            >
              Confirmed (247)
            </button>
            <button
              type="button"
              disabled
              className="w-full min-w-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md sm:w-auto sm:px-3.5"
            >
              Awaiting (38)
            </button>
            <button
              type="button"
              disabled
              className="w-full min-w-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md sm:w-auto sm:px-3.5"
            >
              Declined (35)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>{" "}
              Invited: 320
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>{" "}
              Confirmed: 247
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>{" "}
              Pending: 38
            </span>
          </div>
        </div>

        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Example guest list, scroll horizontally to see all columns"
        >
          <table className="min-w-[760px] w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-6">
                  Family / Guest Group
                </th>
                <th scope="col" className="py-3.5 px-6">
                  Invited Ceremonies
                </th>
                <th scope="col" className="py-3.5 px-6">
                  Pax
                </th>
                <th scope="col" className="py-3.5 px-6">
                  Invitation
                </th>
                <th scope="col" className="py-3.5 px-6">
                  RSVP Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body-sm text-body-sm">
              <tr className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-4 px-6 font-title-md text-on-surface">
                  Sharma Family
                  <span className="block font-body-sm text-on-surface-variant font-normal">
                    Groom&apos;s Maternal Uncle · Mumbai
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Haldi
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Sangeet
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Vivaah
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Reception
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 font-title-md text-on-surface">5</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium">
                    Family of 5
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{" "}
                    Confirmed
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-4 px-6 font-title-md text-on-surface">
                  Office Colleagues (Tech Team)
                  <span className="block font-body-sm text-on-surface-variant font-normal">
                    Bride&apos;s Colleagues · Pune
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Vivaah
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Reception
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 font-title-md text-on-surface">
                  10{" "}
                  <span className="text-on-surface-variant font-normal">
                    / 12
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                    Group of 12
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{" "}
                    Confirmed
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-4 px-6 font-title-md text-on-surface">
                  Kulkarni Parivar
                  <span className="block font-body-sm text-on-surface-variant font-normal">
                    Bride&apos;s Paternal Cousins · Nashik
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Sangeet
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Vivaah
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Reception
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 font-title-md text-on-surface">4</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                    Family of 4
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{" "}
                    Confirmed
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-4 px-6 font-title-md text-on-surface">
                  Amit &amp; Neha Deshmukh
                  <span className="block font-body-sm text-on-surface-variant font-normal">
                    College Friends · Bengaluru
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Haldi
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Sangeet
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Vivaah
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Reception
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 font-title-md text-on-surface">2</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-medium">
                    Couple
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{" "}
                    Confirmed
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-surface-container-low/40 transition-colors">
                <td className="py-4 px-6 font-title-md text-on-surface">
                  Vikram Mehta
                  <span className="block font-body-sm text-on-surface-variant font-normal">
                    High School Friend · Dubai
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Sangeet
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                      Reception
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 font-title-md text-on-surface">1</td>
                <td className="py-4 px-6">
                  <span className="text-on-surface-variant text-[11px]">
                    Pending reply
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>{" "}
                    Awaiting
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
