import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your private Vivaahly organizer workspace.",
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  if (await getCurrentOrganizer()) redirect("/app");

  const { registered } = await searchParams;
  return <AuthForm mode="sign-in" registered={registered === "1"} />;
}
