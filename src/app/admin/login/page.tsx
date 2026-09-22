import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  reset: "Your password has been updated. Sign in with your new password.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return <LoginForm notice={notice ? NOTICES[notice] : undefined} />;
}
