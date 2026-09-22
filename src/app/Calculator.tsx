"use client";

import { useActionState, useEffect, useRef } from "react";
import { calculateSalaryAction, type CalculateState } from "./actions";
import { useToast } from "@/components/notifications/NotificationsProvider";

const initialState: CalculateState = {};

export default function Calculator({
  departments,
}: {
  departments: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    calculateSalaryAction,
    initialState,
  );
  const toast = useToast();
  const lastResultRef = useRef<typeof state.result>(undefined);

  useEffect(() => {
    if (state.result && state.result !== lastResultRef.current) {
      lastResultRef.current = state.result;
      toast.success(
        "Salary calculated",
        `${state.result.name} · ${state.result.departmentName} · ₹${state.result.salary.toLocaleString("en-IN")}`,
      );
    }
  }, [state.result, toast]);

  if (departments.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No departments have been configured yet. An admin needs to add
        departments and salary ranges first.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-black/10 p-6 dark:border-white/10"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          type="text"
          required
          className="h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Department</span>
        <select
          name="departmentId"
          required
          className="h-10 rounded-md border border-black/15 bg-white px-3 text-sm text-black outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Qualification</span>
        <select
          name="qualification"
          required
          className="h-10 rounded-md border border-black/15 bg-white px-3 text-sm text-black outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40"
        >
          <option value="ME">ME</option>
          <option value="PhD">PhD</option>
        </select>
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Experience (years)</span>
          <input
            name="years"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            required
            className="h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Experience (months)</span>
          <input
            name="months"
            type="number"
            min={0}
            max={11}
            step={1}
            defaultValue={0}
            required
            className="h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-black text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Calculating..." : "Calculate salary"}
      </button>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state.result && (
        <div className="rounded-lg bg-black/5 p-4 dark:bg-white/10">
          <p className="text-sm text-black/60 dark:text-white/60">
            {state.result.name} &middot; {state.result.departmentName}{" "}
            &middot; {state.result.qualification}
          </p>
          <p className="text-2xl font-semibold">
            ₹{state.result.salary.toLocaleString("en-IN")}
          </p>
          {state.result.cappedExperience && (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              Experience exceeds the configured maximum, so the maximum was
              used for this calculation.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
