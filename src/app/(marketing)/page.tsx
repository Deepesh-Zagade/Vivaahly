import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-6 border-b border-neutral-200 pb-6">
          <Link href="/" className="text-xl font-semibold no-underline">
            Vivaahly
          </Link>
          <Link href="/app" className="text-sm font-medium">
            Organizer workspace
          </Link>
        </header>

        <section className="py-20 sm:py-28">
          <p className="text-sm font-medium text-neutral-600">Marketing landing page</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Vivaahly landing page foundation
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
            This route is reserved for the approved Vivaahly landing-page design. Final content,
            typography, colors, imagery, and components will be implemented from the supplied design
            context.
          </p>
        </section>

        <footer className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          Vivaahly scaffold
        </footer>
      </div>
    </main>
  );
}
