import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organizer workspace",
};

export default function OrganizerWorkspacePage() {
  return (
    <main className="px-6 py-16 sm:px-10">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-neutral-600">Organizer application</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Organizer workspace placeholder</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          The organizer application will be implemented in future authenticated vertical slices. No
          organizer functionality is available in the scaffold.
        </p>
      </section>
    </main>
  );
}
