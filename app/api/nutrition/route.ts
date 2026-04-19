import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

export interface NutritionData {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  servingSize?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
function fallbackNutrition(label: string): NutritionData {
  return {
    calories: "6969 kcal",
    protein: "6 g",
    carbs: "35 g",
    fat: "8 g",
    fiber: "3 g",
    servingSize: "1 serving",
  };
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { label } = body as { label: string };

    if (!label) {
      return NextResponse.json({ error: "No food label provided" }, { status: 400 });
    }

    const prompt = `
Provide nutritional values for a standard Indian serving of "${label.replace(/_/g, " ")}".

Return ONLY valid JSON:
{
  "calories": "X kcal",
  "protein": "X g",
  "carbs": "X g",
  "fat": "X g",
  "fiber": "X g",
  "servingSize": "X g or 1 bowl/roti/etc"
}
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", 
      messages: [
        {
          role: "system",
          content: "You are a nutrition API. Only return JSON. No explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2, // lower = more structured
    });

    let text = completion.choices[0]?.message?.content?.trim() || "";

    // Clean response
    text = text.replace(/```json\n?/gi, "").replace(/```/g, "").trim();

    let nutrition: NutritionData;

    try {
      nutrition = JSON.parse(text);
    } catch {
      console.error("Groq JSON parse failed:", text);

      nutrition = fallbackNutrition(label);
    }

    return NextResponse.json({ nutrition });

  } catch (err) {
    console.error("Groq error:", err);

    return NextResponse.json({
      nutrition: fallbackNutrition("default"),
    });
  }
}