import Link from "next/link";
import Logo from "@/components/Logo";
import { findValidToken } from "@/lib/accountTokens";
import SetPasswordForm from "./SetPasswordForm";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = await findValidToken(token);

  if (!valid) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black/20">
          <Logo size={44} />
          <h1 className="mt-3 mb-1 text-xl font-semibold">Link expired</h1>
          <p className="mb-6 text-sm text-black/60 dark:text-white/60">
            This link is invalid, has already been used, or has expired.
          </p>
          <Link
            href="/admin/forgot-password"
            className="block w-full rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <SetPasswordForm
      token={token}
      email={valid.account.email ?? valid.account.username ?? ""}
      isSetup={!valid.account.hasPassword}
      role={valid.account.role}
    />
  );
}
