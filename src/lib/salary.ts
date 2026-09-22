export type Qualification = "ME" | "PhD";

export const PHD_EXPERIENCE_NOTICE =
  "For PhD holders, experience is calculated only from the date the PhD was awarded — not total years of work experience.";

export interface SalaryCalcInput {
  minSalary: number;
  maxSalary: number;
  minExperienceYears: number;
  maxExperienceYears: number;
  experienceYears: number;
  experienceMonths: number;
}

/**
 * Linearly interpolates salary between minSalary (at minExperienceYears)
 * and maxSalary (at maxExperienceYears). Experience beyond the configured
 * max is clamped down to the max before calculating.
 */
export function calculateSalary({
  minSalary,
  maxSalary,
  minExperienceYears,
  maxExperienceYears,
  experienceYears,
  experienceMonths,
}: SalaryCalcInput): number {
  const totalExperience = experienceYears + experienceMonths / 12;
  const clampedExperience = Math.min(
    Math.max(totalExperience, minExperienceYears),
    maxExperienceYears,
  );

  const span = maxExperienceYears - minExperienceYears;
  const fraction =
    span <= 0 ? 1 : (clampedExperience - minExperienceYears) / span;

  const salary = minSalary + (maxSalary - minSalary) * fraction;

  return Math.round(salary);
}
