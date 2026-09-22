"use client";

import { useActionState, useEffect, useRef } from "react";
import type { CurrentUser } from "@/lib/auth";
import { useToast } from "@/components/notifications/NotificationsProvider";
import PasswordInput from "@/components/PasswordInput";
import {
  changePasswordAction,
  updateProfileAction,
  type AccountActionState,
} from "./actions";

const initialState: AccountActionState = {};

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40";
const labelClass = "mb-1 block text-sm font-medium";
const buttonClass =
  "rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80";

export default function AccountSettings({ user }: { user: CurrentUser }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success("Profile updated");
  }, [state, toast]);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20"
    >
      <h2 className="mb-1 text-base font-semibold">Profile</h2>
      <p className="mb-5 text-sm text-black/60 dark:text-white/60">
        Your role is{" "}
        <span className="font-medium text-black dark:text-white">
          {user.role === "dev" ? "Developer" : "Admin"}
        </span>
        {user.username ? ` · username ${user.username}` : ""}.
      </p>

      <label className={labelClass} htmlFor="name">
        Full name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        defaultValue={user.name ?? ""}
        required
        className={`${inputClass} mb-4`}
      />

      <label className={labelClass} htmlFor="designation">
        Designation
      </label>
      <input
        id="designation"
        name="designation"
        type="text"
        defaultValue={user.designation ?? ""}
        placeholder="e.g. HR Manager, Professor"
        required
        className={`${inputClass} mb-4`}
      />

      <label className={labelClass} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        defaultValue={user.email ?? ""}
        required
        className={`${inputClass} mb-1`}
      />
      <p className="mb-5 text-xs text-black/50 dark:text-white/50">
        Used to sign in and to receive password reset links.
      </p>

      {state.error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Password changed");
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20"
    >
      <h2 className="mb-1 text-base font-semibold">Change password</h2>
      <p className="mb-5 text-sm text-black/60 dark:text-white/60">
        Use at least 8 characters.
      </p>

      <label className={labelClass} htmlFor="current">
        Current password
      </label>
      <PasswordInput
        id="current"
        name="current"
        autoComplete="current-password"
        required
        wrapperClassName="mb-4"
      />

      <label className={labelClass} htmlFor="next">
        New password
      </label>
      <PasswordInput
        id="next"
        name="next"
        autoComplete="new-password"
        minLength={8}
        required
        wrapperClassName="mb-4"
      />

      <label className={labelClass} htmlFor="confirm">
        Confirm new password
      </label>
      <PasswordInput
        id="confirm"
        name="confirm"
        autoComplete="new-password"
        minLength={8}
        required
        wrapperClassName="mb-5"
      />

      {state.error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
