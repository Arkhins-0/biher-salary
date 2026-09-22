"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

const initialState: LoginState = {};

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black/20"
      >
        <Logo size={44} />
        <h1 className="mt-3 mb-1 text-xl font-semibold">Staff Login</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Sign in to manage salary ranges and view calculation history.
        </p>

        {notice && (
          <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            {notice}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="identifier">
          Email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          className={`${inputClass} mb-4`}
        />

        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Link
            href="/admin/forgot-password"
            className="text-xs text-black/60 underline underline-offset-4 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          wrapperClassName="mb-6"
        />

        {state.error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            {state.error}{" "}
            {state.needsSetup && (
              <Link
                href="/admin/forgot-password"
                className="underline underline-offset-4"
              >
                Request a new setup link
              </Link>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
