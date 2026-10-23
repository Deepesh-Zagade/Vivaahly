import Link from "next/link";

export default function OrganizerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <Link href="/" className="text-xl font-semibold no-underline">
            Vivaahly
          </Link>
          <nav aria-label="Organizer navigation">
            <Link href="/" className="text-sm font-medium">
              Back to home
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
