export const plans = {
  monthly: { label: "Monthly", amount: 499, interval: "month" },
  annual: { label: "Annual", amount: 2900, interval: "year" },
} as const;
export type Plan = keyof typeof plans;

export function isPlan(value: unknown): value is Plan {
  return value === "monthly" || value === "annual";
}

export function displayPrice(plan: Plan) {
  const dollars = plans[plan].amount / 100;
  return "$" + dollars.toFixed(2);
}
