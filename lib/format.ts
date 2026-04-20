import { MealRecord } from "@/lib/types";

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function extractNumber(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function sumNutrition(meals: MealRecord[], key: keyof Pick<MealRecord, "calories" | "protein" | "carbs" | "fat">) {
  return meals.reduce((total, meal) => total + extractNumber(meal[key]), 0);
}
