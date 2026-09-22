"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  useConfirm,
  useToast,
} from "@/components/notifications/NotificationsProvider";
import {
  createAccountAction,
  deleteAccountAction,
  resendInviteAction,
  setDisabledAction,
  type AccountsActionState,
} from "./actions";

export interface AccountRow {
  id: number;
  username: string | null;
  email: string | null;
  name: string | null;
  designation: string | null;
  role: "admin" | "dev";
  disabled: boolean;
  pending: boolean;
  createdAt: string;
}

const initialState: AccountsActionState = {};

const inputClass =
  "h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40";
const smallButton =
  "rounded-md border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10";

export default function AccountsManager({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[];
  currentUserId: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CreateAccountForm />
      <AccountsTable accounts={accounts} currentUserId={currentUserId} />
    </div>
  );
}

function CreateAccountForm() {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createAccountAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Account created", state.success);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20"
    >
      <h2 className="mb-1 text-base font-semibold">Add an account</h2>
      <p className="mb-4 text-sm text-black/60 dark:text-white/60">
        Enter an email address. They&apos;ll receive a link to choose their
        name, designation and password on first sign-in.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[240px] flex-1 flex-col">
          <label className="mb-1 text-sm font-medium" htmlFor="new-email">
            Email
          </label>
          <input
            id="new-email"
            name="email"
            type="email"
            required
            placeholder="person@example.com"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium" htmlFor="new-role">
            Role
          </label>
          <select
            id="new-role"
            name="role"
            defaultValue="admin"
            className={`${inputClass} bg-white dark:bg-neutral-900`}
          >
            <option value="admin">Admin</option>
            <option value="dev">Developer</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {pending ? "Sending invite..." : "Create and send invite"}
        </button>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

function StatusBadge({ account }: { account: AccountRow }) {
  if (account.disabled) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        Disabled
      </span>
    );
  }
  if (account.pending) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        Pending setup
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
      Active
    </span>
  );
}

function AccountsTable({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[];
  currentUserId: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? accounts.filter((a) =>
        [a.email, a.username, a.name, a.designation]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
    : accounts;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className={`${inputClass} w-full max-w-sm`}
      />

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-black/60 dark:bg-white/[0.04] dark:text-white/60">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-black/60 dark:text-white/60"
                >
                  No accounts match.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-t border-black/10 dark:border-white/10"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {a.name ?? a.email ?? a.username}
                    {a.id === currentUserId && (
                      <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">
                    {a.email ?? (a.username ? `username: ${a.username}` : "")}
                  </div>
                </td>
                <td className="px-4 py-3 text-black/70 dark:text-white/70">
                  {a.designation ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {a.role === "dev" ? "Developer" : "Admin"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge account={a} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-black/70 dark:text-white/70">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {a.id !== currentUserId && <RowActions account={a} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({ account }: { account: AccountRow }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  function run(
    action: (
      prev: AccountsActionState,
      formData: FormData,
    ) => Promise<AccountsActionState>,
    fields: Record<string, string>,
    successTitle: string,
  ) {
    const fd = new FormData();
    fd.set("id", String(account.id));
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    startTransition(async () => {
      const result = await action(initialState, fd);
      if (result.error) toast.error("Action failed", result.error);
      else toast.success(successTitle, result.success);
    });
  }

  const label = account.email ?? account.username ?? `#${account.id}`;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {account.pending && account.email && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(resendInviteAction, {}, "Invite sent")}
          className={smallButton}
        >
          Resend invite
        </button>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={async () => {
          if (account.disabled) {
            run(setDisabledAction, { disabled: "false" }, "Account enabled");
            return;
          }
          const ok = await confirm({
            title: `Disable ${label}?`,
            description:
              "They will be signed out and unable to log in until re-enabled.",
            confirmLabel: "Disable",
          });
          if (ok) run(setDisabledAction, { disabled: "true" }, "Account disabled");
        }}
        className={smallButton}
      >
        {account.disabled ? "Enable" : "Disable"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={async () => {
          const ok = await confirm({
            title: `Remove ${label}?`,
            description:
              "This permanently deletes the account. This cannot be undone.",
            confirmLabel: "Remove",
          });
          if (ok) run(deleteAccountAction, {}, "Account removed");
        }}
        className={`${smallButton} text-red-600 dark:text-red-400`}
      >
        Remove
      </button>
    </div>
  );
}
