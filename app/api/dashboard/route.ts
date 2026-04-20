import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMealsForUser } from "@/lib/db";
import { extractNumber, sumNutrition } from "@/lib/format";
import { normalizeProfile } from "@/lib/intake";
import { MealRecord, NutrientTargets } from "@/lib/types";

export const runtime = "nodejs";

const nutrientKeys = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
  "potassium",
  "calcium",
  "iron",
  "vitaminA",
  "vitaminC",
] as const;

export async function GET() {
  const user = await requireUser();
  const profile = normalizeProfile(user.profile);
  const meals = await getMealsForUser(user.id);
  const todayMeals = meals.filter(isFromToday);
  const totals = nutrientKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: sumNutrition(todayMeals, key),
    }),
    {} as Record<(typeof nutrientKeys)[number], number>
  );
  const progress = nutrientKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: getProgress(totals[key], profile.intakeTargets[key]),
    }),
    {} as Record<(typeof nutrientKeys)[number], number>
  );

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile,
    },
    meals,
    todayMeals,
    totals,
    targets: profile.intakeTargets,
    progress,
  });
}

function isFromToday(meal: MealRecord) {
  const mealDate = new Date(meal.createdAt);
  const now = new Date();

  return (
    mealDate.getFullYear() === now.getFullYear() &&
    mealDate.getMonth() === now.getMonth() &&
    mealDate.getDate() === now.getDate()
  );
}

function getProgress(total: number, target: NutrientTargets[keyof NutrientTargets]) {
  const targetNumber = extractNumber(target);
  if (!targetNumber) return 0;
  return Math.min(999, Math.round((total / targetNumber) * 100));
}
