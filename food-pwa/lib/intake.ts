import { GoogleGenerativeAI } from "@google/generative-ai";
import { NutrientTargets, UserProfile } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.0-flash";

export const DEFAULT_INTAKE_TARGETS: NutrientTargets = {
  calories: "2000 kcal",
  protein: "60 g",
  carbs: "250 g",
  fat: "65 g",
  fiber: "30 g",
  sugar: "50 g",
  sodium: "2000 mg",
  potassium: "3500 mg",
  calcium: "1000 mg",
  iron: "18 mg",
  vitaminA: "900 mcg",
  vitaminC: "80 mg",
};

export function normalizeIntakeTargets(
  targets: Partial<NutrientTargets> | undefined
): NutrientTargets {
  return {
    calories: normalizeText(targets?.calories) || DEFAULT_INTAKE_TARGETS.calories,
    protein: normalizeText(targets?.protein) || DEFAULT_INTAKE_TARGETS.protein,
    carbs: normalizeText(targets?.carbs) || DEFAULT_INTAKE_TARGETS.carbs,
    fat: normalizeText(targets?.fat) || DEFAULT_INTAKE_TARGETS.fat,
    fiber: normalizeText(targets?.fiber) || DEFAULT_INTAKE_TARGETS.fiber,
    sugar: normalizeText(targets?.sugar) || DEFAULT_INTAKE_TARGETS.sugar,
    sodium: normalizeText(targets?.sodium) || DEFAULT_INTAKE_TARGETS.sodium,
    potassium: normalizeText(targets?.potassium) || DEFAULT_INTAKE_TARGETS.potassium,
    calcium: normalizeText(targets?.calcium) || DEFAULT_INTAKE_TARGETS.calcium,
    iron: normalizeText(targets?.iron) || DEFAULT_INTAKE_TARGETS.iron,
    vitaminA: normalizeText(targets?.vitaminA) || DEFAULT_INTAKE_TARGETS.vitaminA,
    vitaminC: normalizeText(targets?.vitaminC) || DEFAULT_INTAKE_TARGETS.vitaminC,
  };
}

export function normalizeProfile(profile: Partial<UserProfile>): UserProfile {
  return {
    age: normalizeText(profile.age),
    height: normalizeText(profile.height),
    weight: normalizeText(profile.weight),
    gender: normalizeText(profile.gender),
    intakeTargets: normalizeIntakeTargets(profile.intakeTargets),
    intakeSource: profile.intakeSource || "fallback",
    intakeUpdatedAt: normalizeText(profile.intakeUpdatedAt) || new Date().toISOString(),
  };
}

export async function getGeminiIntakeTargets(profile: {
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      source: "fallback" as const,
      targets: estimateFallbackTargets(profile),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(
      `You are a nutrition planning API for a food tracking app.

Estimate safe daily nutrient intake targets for this person:
- Age: ${profile.age || "unknown"}
- Gender: ${profile.gender || "unknown"}
- Height: ${profile.height || "unknown"}
- Weight: ${profile.weight || "unknown"}
- Context: Indian diet, general healthy adult target, not medical advice.

Return ONLY valid JSON:
{
  "calories": "",
  "protein": "",
  "carbs": "",
  "fat": "",
  "fiber": "",
  "sugar": "",
  "sodium": "",
  "potassium": "",
  "calcium": "",
  "iron": "",
  "vitaminA": "",
  "vitaminC": ""
}`
    );

    return {
      source: "gemini" as const,
      targets: normalizeIntakeTargets(JSON.parse(cleanJson(result.response.text()))),
    };
  } catch (error) {
    console.error("Gemini intake target generation failed:", error);
    return {
      source: "fallback" as const,
      targets: estimateFallbackTargets(profile),
    };
  }
}

function estimateFallbackTargets(profile: {
  age?: string;
  gender?: string;
  weight?: string;
}): NutrientTargets {
  const age = parseNumber(profile.age);
  const weight = parseNumber(profile.weight);
  const gender = profile.gender?.toLowerCase() || "";
  const isFemale = gender.includes("female") || gender.includes("woman");
  const calories =
    age > 60 ? (isFemale ? 1700 : 2000) : isFemale ? 1900 : 2300;
  const protein = Math.max(50, Math.round((weight || 65) * 0.9));

  return {
    ...DEFAULT_INTAKE_TARGETS,
    calories: `${calories} kcal`,
    protein: `${protein} g`,
    carbs: `${Math.round(calories * 0.5 / 4)} g`,
    fat: `${Math.round(calories * 0.28 / 9)} g`,
    iron: isFemale && age < 51 ? "18 mg" : "8 mg",
  };
}

function cleanJson(value: string) {
  return value.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeText(value: unknown) {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}
