import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto max-w-[1440px] px-margin-mobile py-12 md:px-margin">
        <div className="flex flex-col justify-between gap-10 border-b border-outline/40 pb-10 md:flex-row">
          <div className="max-w-md">
            <Brand inverse />
            <p className="mt-3 text-body-md text-inverse-on-surface/80">
              A calmer way for families to organize an Indian wedding.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-start gap-x-6 gap-y-4 text-label-md text-inverse-on-surface/80"
          >
            <a href="#product" className="py-2 hover:text-white">
              Product
            </a>
            <a href="#how-it-works" className="py-2 hover:text-white">
              How it works
            </a>
            {["Privacy", "Terms", "Sign in"].map((label) => (
              <button
                key={label}
                type="button"
                aria-disabled="true"
                className="py-2"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-3 pt-6 text-body-sm text-inverse-on-surface/75 sm:flex-row">
          <p>© {new Date().getFullYear()} Vivaahly. All rights reserved.</p>
          <p className="font-headline-lg text-base italic">
            Order &amp; quiet luxury for family celebrations
          </p>
        </div>
      </div>
    </footer>
  );
}
