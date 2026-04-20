import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createMeal, getMealsForUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  const meals = await getMealsForUser(user.id);
  return NextResponse.json({ meals });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const rawMeals = Array.isArray(body?.items) ? body.items : [body];
    const groupId = String(body?.groupId || randomUUID());
    const groupName = String(body?.groupName || "Scanned meal");
    const createdAt = new Date().toISOString();
    const createdMeals = [];

    for (const rawMeal of rawMeals) {
      const {
        name,
        calories,
        protein,
        carbs,
        fat,
        fats,
        fiber,
        sugar,
        sodium,
        potassium,
        calcium,
        iron,
        vitaminA,
        vitaminC,
        micronutrients,
        portion,
        servingSize,
        confidence,
        quantity,
      } = rawMeal as Record<string, string | number | Record<string, string>>;

      if (!name || !calories || !protein || !carbs || (!fat && !fats)) {
        return NextResponse.json(
          { error: "Meal name and nutrition values are required." },
          { status: 400 }
        );
      }

      const micros =
        typeof micronutrients === "object" && micronutrients !== null
          ? micronutrients
          : {};

      const meal = await createMeal({
        id: randomUUID(),
        userId: user.id,
        groupId,
        groupName,
        quantity: Number(quantity ?? 1),
        name: String(name),
        calories: String(calories),
        protein: String(protein),
        carbs: String(carbs),
        fat: String(fat ?? fats),
        fiber: String(fiber ?? ""),
        sugar: String(sugar ?? ""),
        sodium: String(sodium ?? micros.sodium ?? ""),
        potassium: String(potassium ?? micros.potassium ?? ""),
        calcium: String(calcium ?? micros.calcium ?? ""),
        iron: String(iron ?? micros.iron ?? ""),
        vitaminA: String(vitaminA ?? micros.vitaminA ?? ""),
        vitaminC: String(vitaminC ?? micros.vitaminC ?? ""),
        servingSize: String(servingSize ?? portion ?? ""),
        confidence: Number(confidence ?? 0),
        createdAt,
      });

      createdMeals.push(meal);
    }

    return NextResponse.json({ ok: true, meals: createdMeals });
  } catch (error) {
    console.error("Create meal error:", error);
    return NextResponse.json({ error: "Unable to save meal." }, { status: 500 });
  }
}
