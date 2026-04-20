import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

type NutritionItem = {
  name: string;
  portion: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugar: string;
  micronutrients: {
    sodium: string;
    potassium: string;
    calcium: string;
    iron: string;
    vitaminA: string;
    vitaminC: string;
  };
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      portion?: string;
      quantity?: number;
    };
    const name = body.name?.trim();
    const portion = body.portion?.trim() || "1 serving";
    const quantity = Math.max(0.25, Number(body.quantity || 1));

    if (!name) {
      return NextResponse.json({ error: "Food name is required." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition API. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: `Estimate macro and micronutrients for this food item.

Food: ${name}
Portion: ${portion}
Quantity multiplier: ${quantity}
Context: Indian food if unclear.

Return values for the TOTAL quantity, not per 1 serving.

Return ONLY valid JSON:
{
  "name": "",
  "portion": "",
  "calories": "",
  "protein": "",
  "carbs": "",
  "fats": "",
  "fiber": "",
  "sugar": "",
  "micronutrients": {
    "sodium": "",
    "potassium": "",
    "calcium": "",
    "iron": "",
    "vitaminA": "",
    "vitaminC": ""
  }
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Groq returned an empty response.");
    }

    const item = normalizeItem(JSON.parse(cleanJson(text)));
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Food nutrition error:", error);
    return NextResponse.json(
      { error: "Unable to calculate nutrition for this food." },
      { status: 500 }
    );
  }
}

function normalizeItem(value: unknown): NutritionItem {
  const item =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const micros =
    typeof item.micronutrients === "object" && item.micronutrients !== null
      ? (item.micronutrients as Record<string, unknown>)
      : {};

  return {
    name: normalizeText(item.name),
    portion: normalizeText(item.portion) || "1 serving",
    calories: normalizeText(item.calories) || "0 kcal",
    protein: normalizeText(item.protein) || "0 g",
    carbs: normalizeText(item.carbs) || "0 g",
    fats: normalizeText(item.fats) || "0 g",
    fiber: normalizeText(item.fiber) || "0 g",
    sugar: normalizeText(item.sugar) || "0 g",
    micronutrients: {
      sodium: normalizeText(micros.sodium) || "0 mg",
      potassium: normalizeText(micros.potassium) || "0 mg",
      calcium: normalizeText(micros.calcium) || "0 mg",
      iron: normalizeText(micros.iron) || "0 mg",
      vitaminA: normalizeText(micros.vitaminA) || "0 mcg",
      vitaminC: normalizeText(micros.vitaminC) || "0 mg",
    },
  };
}

function cleanJson(value: string) {
  return value.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeText(value: unknown) {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value.trim() : "";
}
