import LoginForm, { type LoginNotice } from "./LoginForm";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, LoginNotice> = {
  reset: {
    tone: "success",
    text: "Your password has been updated. Sign in with your new password.",
  },
  "email-verified": {
    tone: "success",
    text: "Your new email address is verified. Sign in with it to continue.",
  },
  "email-invalid": {
    tone: "error",
    text: "That verification link is invalid or has expired. Sign in and request the email change again from Account settings.",
  },
  "email-taken": {
    tone: "error",
    text: "That email address is already used by another account. Sign in and choose a different one.",
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return <LoginForm notice={notice ? NOTICES[notice] : undefined} />;
}
