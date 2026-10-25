import { Icon } from "../icon";
import Image from "next/image";

// Static product illustration adapted from the approved Stitch homepage.
export function MediaSection() {
  return (
    <section
      id="media-hub"
      aria-labelledby="media-hub-heading"
      className="w-full bg-surface-container-low py-20 lg:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-2">
              Guest Photo &amp; Video Sharing
            </span>
            <h2
              id="media-hub-heading"
              className="font-headline-lg text-headline-lg text-on-surface tracking-tight"
            >
              One QR code. Every precious memory.
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Let family and friends instantly upload and view candid memories
            without downloading apps or creating accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant uppercase tracking-wider font-semibold">
                Step 01 · At The Tables
              </span>
              <div className="mt-6 text-center p-6 border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low">
                <span className="font-headline-sm text-headline-sm italic text-primary block mb-1">
                  Deepesh &amp; Priya
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Sangeet Night Celebration
                </p>

                <div className="w-32 h-32 mx-auto bg-surface-container-lowest p-2 rounded-xl border border-outline-variant flex items-center justify-center">
                  <svg
                    role="img"
                    aria-label="Illustrative wedding media QR code"
                    className="w-full h-full text-primary"
                    fill="currentColor"
                    viewBox="0 0 100 100"
                  >
                    <path d="M0,0 h40 v40 h-40 z M10,10 v20 h20 v-20 z M60,0 h40 v40 h-40 z M70,10 v20 h20 v-20 z M0,60 h40 v40 h-40 z M10,70 v20 h20 v-20 z M50,50 h10 v10 h-10 z M70,50 h10 v10 h-10 z M50,70 h20 v10 h-20 z M80,80 h20 v20 h-20 z M60,80 h10 v20 h-10 z"></path>
                  </svg>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-4">
                  Point your camera to share your candid photos
                </p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-4">
              Share your wedding’s media QR code on table cards and invitations.
            </p>
          </div>

          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/60 gap-3">
                <div>
                  <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant uppercase tracking-wider font-semibold">
                    Step 02 &amp; 03 · Family Photo Gallery
                  </span>
                  <h3 className="font-title-md text-title-md text-on-surface mt-1">
                    Sangeet Night Candid Album · 184 photos uploaded
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                  >
                    Upload Photos
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors"
                  >
                    Download Full Album
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-xl overflow-hidden relative shadow-sm border border-outline-variant/40 group">
                <Image
                  alt="Indian wedding sangeet banquet table with laughing family members celebrating together"
                  className="w-full h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  src="/brand/wedding-celebration.jpg"
                  width={1200}
                  height={800}
                  sizes="(max-width: 1023px) 100vw, 65vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="flex items-center gap-2 text-[12px] opacity-90 mb-1">
                      <Icon name="photo_camera" className=" text-[16px]" />
                      <span className="">
                        Uploaded by Cousin Sneha · 10 minutes ago
                      </span>
                    </div>
                    <p className="font-headline-sm text-headline-sm text-white">
                      &quot;Uncle &amp; Auntie during the retro family dance
                      rounds!&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span className="">
                View, upload, and download your shared wedding memories
              </span>
              <span className="text-primary font-label-sm text-label-sm font-semibold">
                Shared through your wedding media link
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
