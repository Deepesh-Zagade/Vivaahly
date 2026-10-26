import { EB_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Brand } from "@/components/brand";

const editorial = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial",
});

const interfaceFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-interface",
});

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${editorial.variable} ${interfaceFont.variable} auth-page flex flex-col`}>
      <header className="z-20 border-b border-surface-container-highest bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-margin-mobile md:px-margin">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-label-md font-semibold text-on-surface-variant no-underline transition-colors hover:text-primary"
          >
            <BackArrowIcon />
            <span className="hidden min-[360px]:inline">Back to home</span>
            <span className="min-[360px]:hidden">Home</span>
          </Link>
        </div>
      </header>
      <main className="auth-ambient relative flex flex-1 items-center justify-center overflow-hidden px-margin-mobile py-10 sm:py-14 md:px-margin md:py-16">
        <div className="relative z-10 w-full">{children}</div>
      </main>
      <footer className="z-10 border-t border-surface-container-highest bg-surface-container-low px-margin-mobile py-5 md:px-margin">
        <p className="mx-auto max-w-7xl text-center text-body-sm text-on-surface-variant">
          Guests don&apos;t need an account—use the personalized invitation link you received.
        </p>
      </footer>
    </div>
  );
}
