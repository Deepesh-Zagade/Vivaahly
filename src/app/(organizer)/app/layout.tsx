import { EB_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/(organizer)/app/_components/logout-button";
import { Brand } from "@/components/brand";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";

const editorial = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-editorial",
});

const interfaceFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-interface",
});

export default async function OrganizerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizer = await getCurrentOrganizer();

  if (!organizer) redirect("/sign-in");

  return (
    <div
      className={`${editorial.variable} ${interfaceFont.variable} min-h-screen bg-surface font-body-md text-on-surface`}
    >
      <header className="border-b border-surface-container-highest bg-surface-container-lowest px-margin-mobile py-4 md:px-margin">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <Brand />
          <LogoutButton />
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
