"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { forgotPasswordAction, type ForgotState } from "./actions";

const initialState: ForgotState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black/20"
      >
        <Logo size={44} />
        <h1 className="mt-3 mb-1 text-xl font-semibold">Reset password</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Enter your account email and we&apos;ll send you a link to set a new
          password. If your account was never set up, you&apos;ll get a fresh
          setup link instead.
        </p>

        {state.sent ? (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            If an account exists for that email, a link is on its way. Check
            your inbox (and spam folder).
          </div>
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mb-6 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
            />

            {state.error && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {pending ? "Sending..." : "Send link"}
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href="/admin/login"
            className="text-black/60 underline underline-offset-4 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
