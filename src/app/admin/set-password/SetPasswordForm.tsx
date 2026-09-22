"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import { setPasswordAction, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = {};

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40";

export default function SetPasswordForm({
  token,
  email,
  isSetup,
  role,
}: {
  token: string;
  email: string;
  isSetup: boolean;
  role: "admin" | "dev";
}) {
  const [state, formAction, pending] = useActionState(
    setPasswordAction,
    initialState,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black/20"
      >
        <input type="hidden" name="token" value={token} />
        <Logo size={44} />
        <h1 className="mt-3 mb-1 text-xl font-semibold">
          {isSetup ? "Set up your account" : "Choose a new password"}
        </h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          {isSetup
            ? `You've been given ${role === "dev" ? "developer" : "admin"} access as `
            : "Resetting the password for "}
          <span className="font-medium text-black dark:text-white">
            {email}
          </span>
          .
        </p>

        {isSetup && (
          <>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={`${inputClass} mb-4`}
            />

            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="designation"
            >
              Designation
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              placeholder="e.g. HR Manager, Professor"
              autoComplete="organization-title"
              required
              className={`${inputClass} mb-4`}
            />
          </>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          {isSetup ? "Password" : "New password"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={`${inputClass} mb-4`}
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={`${inputClass} mb-6`}
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
          {pending
            ? "Saving..."
            : isSetup
              ? "Create account and sign in"
              : "Update password"}
        </button>
      </form>
    </main>
  );
}
