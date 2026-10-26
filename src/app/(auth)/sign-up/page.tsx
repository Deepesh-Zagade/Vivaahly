import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a private Vivaahly organizer account.",
};

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await getCurrentOrganizer()) redirect("/app");

  return <AuthForm mode="sign-up" />;
}
