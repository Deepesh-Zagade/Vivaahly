type ContentSkeletonVariant = "dashboard" | "list" | "detail";

const pulse =
  "animate-pulse rounded-lg bg-surface-container-high motion-reduce:animate-none";

function LoadingAnnouncement({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>;
}

export function WorkspaceContentSkeleton({
  variant = "dashboard",
}: {
  variant?: ContentSkeletonVariant;
}) {
  if (variant === "list") return <WorkspaceListSkeleton />;
  if (variant === "detail") return <WorkspaceDetailSkeleton />;

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8"
      role="status"
      aria-busy="true"
    >
      <LoadingAnnouncement label="Loading your wedding dashboard" />
      <div className="space-y-3" aria-hidden="true">
        <div className={`${pulse} h-9 w-64 max-w-[75%]`} />
        <div className={`${pulse} h-4 w-[28rem] max-w-full`} />
      </div>
      <div className="flex flex-wrap gap-3" aria-hidden="true">
        {["w-40", "w-32", "w-40", "w-44", "w-44"].map((width, index) => (
          <div key={index} className={`${pulse} h-12 ${width}`} />
        ))}
      </div>
      <div
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm"
        aria-hidden="true"
      >
        <div className={`${pulse} h-4 w-44`} />
        <div className={`${pulse} mt-4 h-8 w-80 max-w-full`} />
        <div className={`${pulse} mt-3 h-4 w-64 max-w-full`} />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className={`${pulse} h-16`} />
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5"
          >
            <div className={`${pulse} h-3 w-28`} />
            <div className={`${pulse} mt-4 h-9 w-36`} />
            <div className={`${pulse} mt-10 h-4 w-full`} />
            <div className={`${pulse} mt-2 h-4 w-3/4`} />
          </div>
        ))}
      </div>
    </main>
  );
}

function WorkspaceListSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-9 lg:px-8"
      role="status"
      aria-busy="true"
    >
      <LoadingAnnouncement label="Loading workspace content" />
      <div className="flex items-end justify-between gap-5" aria-hidden="true">
        <div className="w-full max-w-2xl space-y-3">
          <div className={`${pulse} h-11 w-72 max-w-[70%]`} />
          <div className={`${pulse} h-4 w-full`} />
        </div>
        <div className={`${pulse} hidden h-12 w-40 sm:block`} />
      </div>
      <div className="mt-9 space-y-8" aria-hidden="true">
        {[0, 1].map((group) => (
          <div key={group}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`${pulse} h-7 w-20`} />
              <div className={`${pulse} h-5 w-52`} />
            </div>
            <div className="space-y-4">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6"
                >
                  <div className="flex gap-5">
                    <div className={`${pulse} hidden h-16 w-16 shrink-0 sm:block`} />
                    <div className="flex-1 space-y-3">
                      <div className={`${pulse} h-7 w-72 max-w-[80%]`} />
                      <div className={`${pulse} h-4 w-80 max-w-full`} />
                      <div className={`${pulse} h-4 w-56 max-w-[70%]`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function WorkspaceDetailSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8"
      role="status"
      aria-busy="true"
    >
      <LoadingAnnouncement label="Loading details" />
      <div className={`${pulse} h-5 w-44`} aria-hidden="true" />
      <div
        className="mt-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 sm:p-8"
        aria-hidden="true"
      >
        <div className={`${pulse} h-3 w-28`} />
        <div className={`${pulse} mt-4 h-12 w-[32rem] max-w-[85%]`} />
        <div className={`${pulse} mt-4 h-5 w-96 max-w-full`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div className="space-y-6 lg:col-span-2">
          {[0, 1].map((item) => (
            <div key={item} className="rounded-2xl border border-outline-variant/60 bg-white p-6">
              <div className={`${pulse} h-6 w-48`} />
              <div className={`${pulse} mt-5 h-4 w-full`} />
              <div className={`${pulse} mt-3 h-4 w-5/6`} />
              <div className={`${pulse} mt-3 h-4 w-2/3`} />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-outline-variant/60 bg-white p-6">
          <div className={`${pulse} h-6 w-36`} />
          <div className={`${pulse} mt-5 h-16 w-full`} />
          <div className={`${pulse} mt-4 h-16 w-full`} />
        </div>
      </div>
    </main>
  );
}

export function WorkspaceFormSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10 lg:px-8"
      role="status"
      aria-busy="true"
    >
      <LoadingAnnouncement label="Loading form" />
      <div className="space-y-3" aria-hidden="true">
        <div className={`${pulse} h-10 w-80 max-w-[80%]`} />
        <div className={`${pulse} h-4 w-[32rem] max-w-full`} />
      </div>
      <div
        className="mt-7 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-8 md:p-10"
        aria-hidden="true"
      >
        {[0, 1, 2].map((section) => (
          <div key={section} className={section ? "mt-10" : ""}>
            <div className="flex items-center gap-3">
              <div className={`${pulse} h-7 w-44`} />
              <div className={`${pulse} h-px flex-1`} />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[0, 1].map((field) => (
                <div key={field}>
                  <div className={`${pulse} h-4 w-32`} />
                  <div className={`${pulse} mt-2 h-12 w-full`} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-10 flex justify-end gap-3 border-t border-outline-variant/60 pt-6">
          <div className={`${pulse} h-12 w-28`} />
          <div className={`${pulse} h-12 w-40`} />
        </div>
      </div>
    </main>
  );
}
