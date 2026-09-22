"use client";

import { useActionState, useState } from "react";
import {
  addDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  type ActionState,
} from "./actions";
import type { DepartmentWithRanges } from "@/lib/departments";

const initialState: ActionState = {};

export default function AdminDashboard({
  departments,
}: {
  departments: DepartmentWithRanges[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="mb-3 text-lg font-semibold">Departments</h2>
        <p className="mb-4 text-sm text-black/60 dark:text-white/60">
          For each department, set the ME and PhD salary ranges and the
          experience range they apply over. Experience at or below the
          minimum maps to the minimum salary, experience at or above the
          maximum maps to the maximum salary, and experience in between is
          scaled linearly (down to the month). Each qualification within a
          department can have its own experience range.
        </p>
        <div className="flex flex-col gap-4">
          {departments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Add department</h2>
        <AddDepartmentForm />
      </div>
    </div>
  );
}

function DepartmentCard({ department }: { department: DepartmentWithRanges }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateDepartmentAction,
    initialState,
  );

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-black/10 p-5 dark:border-white/10">
        <div>
          <p className="font-medium">{department.name}</p>
          <p className="text-sm text-black/60 dark:text-white/60">
            ME: ₹{department.meMin.toLocaleString("en-IN")} &ndash; ₹
            {department.meMax.toLocaleString("en-IN")} over{" "}
            {department.meMinExp}&ndash;{department.meMaxExp} yrs
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            PhD: ₹{department.phdMin.toLocaleString("en-IN")} &ndash; ₹
            {department.phdMax.toLocaleString("en-IN")} over{" "}
            {department.phdMinExp}&ndash;{department.phdMaxExp} yrs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Edit
          </button>
          <form
            action={async (formData) => {
              if (confirm(`Delete "${department.name}"?`)) {
                await deleteDepartmentAction(formData);
              }
            }}
          >
            <input type="hidden" name="departmentId" value={department.id} />
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <input type="hidden" name="departmentId" value={department.id} />
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Field label="Department name" name="name" defaultValue={department.name} isText />
      </div>

      <QualificationFields
        title="ME"
        prefix="me"
        min={department.meMin}
        max={department.meMax}
        minExp={department.meMinExp}
        maxExp={department.meMaxExp}
      />
      <QualificationFields
        title="PhD"
        prefix="phd"
        min={department.phdMin}
        max={department.phdMax}
        minExp={department.phdMinExp}
        maxExp={department.phdMaxExp}
      />

      {state.error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-9 rounded-md border border-black/15 px-4 text-sm dark:border-white/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddDepartmentForm() {
  const [state, formAction, pending] = useActionState(
    addDepartmentAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-dashed border-black/20 p-5 dark:border-white/20"
    >
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Field label="Department name" name="name" isText />
      </div>

      <QualificationFields
        title="ME"
        prefix="me"
        min={70000}
        max={150000}
        minExp={0}
        maxExp={20}
      />
      <QualificationFields
        title="PhD"
        prefix="phd"
        min={90000}
        max={200000}
        minExp={0}
        maxExp={20}
      />

      {state.error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Adding..." : "Add department"}
      </button>
    </form>
  );
}

function QualificationFields({
  title,
  prefix,
  min,
  max,
  minExp,
  maxExp,
}: {
  title: string;
  prefix: "me" | "phd";
  min: number;
  max: number;
  minExp: number;
  maxExp: number;
}) {
  return (
    <fieldset className="mb-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      <p className="mb-2 text-xs text-black/50 dark:text-white/50">
        Salary range
      </p>
      <div className="mb-3 flex flex-wrap gap-4">
        <Field label="Min salary" name={`${prefix}Min`} defaultValue={min} />
        <Field label="Max salary" name={`${prefix}Max`} defaultValue={max} />
      </div>
      <p className="mb-2 text-xs text-black/50 dark:text-white/50">
        Experience range (years)
      </p>
      <div className="flex flex-wrap gap-4">
        <Field
          label="Min experience"
          name={`${prefix}MinExp`}
          defaultValue={minExp}
        />
        <Field
          label="Max experience"
          name={`${prefix}MaxExp`}
          defaultValue={maxExp}
        />
      </div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  defaultValue,
  isText,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  isText?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-black/70 dark:text-white/70">{label}</span>
      <input
        name={name}
        type={isText ? "text" : "number"}
        min={isText ? undefined : 0}
        step={isText ? undefined : 1}
        defaultValue={defaultValue}
        required
        className="h-9 w-36 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
      />
    </label>
  );
}
