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
    const {
      name,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      servingSize,
      confidence,
    } = body as Record<string, string | number>;

    if (!name || !calories || !protein || !carbs || !fat) {
      return NextResponse.json(
        { error: "Meal name and nutrition values are required." },
        { status: 400 }
      );
    }

    const meal = await createMeal({
      id: randomUUID(),
      userId: user.id,
      name: String(name),
      calories: String(calories),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
      fiber: String(fiber ?? ""),
      servingSize: String(servingSize ?? ""),
      confidence: Number(confidence ?? 0),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, meal });
  } catch (error) {
    console.error("Create meal error:", error);
    return NextResponse.json({ error: "Unable to save meal." }, { status: 500 });
  }
}
