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
  searchParams: Promise<{ registered?: string; returnTo?: string }>;
}) {
  const { registered, returnTo: requestedReturnTo } = await searchParams;
  const returnTo = requestedReturnTo?.startsWith("/join/") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : undefined;
  if (await getCurrentOrganizer()) redirect(returnTo ?? "/app");
  return <AuthForm mode="sign-in" registered={registered === "1"} returnTo={returnTo} />;
}
