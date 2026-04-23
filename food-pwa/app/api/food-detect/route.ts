import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-2.5-flash";
const HF_FOOD_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/nateraw/food";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const GEMINI_ATTEMPTS = 3;

const FOOD_DETECTION_PROMPT = `You are a food recognition and nutrition expert.

Step 1: Identify the food item in the image.
Step 2: If multiple items are present, list all major items.
Step 3: Estimate portion size (quantity in terms of number of items or grams if possible).
Step 4: Provide nutritional values strictly per 100 grams of the item (approximate):
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
- Fats (g)
- Fiber (g)
- Sugar (g)
- Key micronutrients: sodium, potassium, calcium, iron, vitamin A, vitamin C

Rules:
- Assume Indian food context if unclear.
- Be realistic and avoid extreme values.
- If unsure, give the closest possible guess.
- If there are multiple visible food items, return every major item separately.
- For "portion", provide the number of items (e.g., "4" for 4 apples) or "1" if it is a single mass (e.g., a bowl of rice).
- For "quantity", provide the estimated total weight in grams (e.g., "300" for 300g). If you only know the count, estimate the total weight of that count in grams.
- Output ONLY valid JSON.

Format:
{
  "items": [
    {
      "name": "",
      "portion": "",
      "quantity": "",
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
    }
  ]
}`;

type Micronutrients = {
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
};

type NutritionItem = {
  name: string;
  portion: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugar: string;
  micronutrients: Micronutrients;
  baseNutrientsPer100g?: any; // We'll compute this below
};

type FoodDetectionResponse = {
  success: boolean;
  source: "gemini" | "fallback";
  items: NutritionItem[];
  error?: string;
};

type ImageInput = {
  buffer: Buffer;
  mimeType: string;
};

type HuggingFacePrediction = {
  label: string;
  score?: number;
};

type ProviderError = {
  provider: string;
  message: string;
};

export async function POST(req: NextRequest) {
  const providerErrors: ProviderError[] = [];

  try {
    const image = await readImageInput(req);

    try {
      const items = await detectWithGemini(image);
      return jsonResponse({
        success: true,
        source: "gemini",
        items,
      });
    } catch (error) {
      providerErrors.push(toProviderError("gemini", error));
      console.error("Gemini food detection failed:", error);
    }

    try {
      const items = await detectWithFallback(image);
      return jsonResponse({
        success: true,
        source: "fallback",
        items,
      });
    } catch (error) {
      providerErrors.push(toProviderError("fallback", error));
      console.error("Fallback food detection failed:", error);
    }

    return jsonResponse(
      {
        success: false,
        source: "fallback",
        items: [],
        error: "Unable to detect food nutrition from the image.",
      },
      502
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid food detection request.";

    return jsonResponse(
      {
        success: false,
        source: "fallback",
        items: [],
        error: message,
      },
      400
    );
  } finally {
    if (providerErrors.length > 0) {
      console.error("Food detection provider errors:", providerErrors);
    }
  }
}

async function readImageInput(req: NextRequest): Promise<ImageInput> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      throw new Error("Missing multipart image file.");
    }

    const mimeType = image.type || "image/jpeg";
    validateMimeType(mimeType);

    const buffer = Buffer.from(await image.arrayBuffer());
    validateImageSize(buffer);

    return { buffer, mimeType };
  }

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      image?: unknown;
      imageBase64?: unknown;
      mimeType?: unknown;
    };

    const rawImage =
      typeof body.image === "string"
        ? body.image
        : typeof body.imageBase64 === "string"
          ? body.imageBase64
          : "";

    if (!rawImage.trim()) {
      throw new Error("Missing base64 image.");
    }

    const { base64, mimeType } = parseBase64Image(
      rawImage,
      typeof body.mimeType === "string" ? body.mimeType : undefined
    );
    validateMimeType(mimeType);

    const buffer = Buffer.from(base64, "base64");
    validateImageSize(buffer);

    return { buffer, mimeType };
  }

  throw new Error("Use multipart/form-data or application/json with a base64 image.");
}

function parseBase64Image(rawImage: string, fallbackMimeType?: string) {
  const dataUrlMatch = rawImage.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2],
    };
  }

  return {
    mimeType: fallbackMimeType || "image/jpeg",
    base64: rawImage,
  };
}

function validateMimeType(mimeType: string) {
  if (!mimeType.startsWith("image/")) {
    throw new Error("Uploaded file must be an image.");
  }
}

function validateImageSize(buffer: Buffer) {
  if (buffer.length === 0) {
    throw new Error("Image cannot be empty.");
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 8MB.");
  }
}

async function detectWithGemini(image: ImageInput): Promise<NutritionItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= GEMINI_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent([
        FOOD_DETECTION_PROMPT,
        {
          inlineData: {
            data: image.buffer.toString("base64"),
            mimeType: image.mimeType,
          },
        },
      ]);

      const text = result.response.text();
      return normalizeItems(parseItemsJson(text));
    } catch (error) {
      lastError = error;

      if (attempt < GEMINI_ATTEMPTS) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini failed after retries.");
}

async function detectWithFallback(image: ImageInput): Promise<NutritionItem[]> {
  const predictions = await detectFoodWithHuggingFace(image);
  const labels = predictions.slice(0, 3).map((prediction) => prediction.label);

  if (labels.length === 0) {
    throw new Error("Hugging Face returned no food predictions.");
  }

  return getNutritionWithGrok(labels);
}

async function detectFoodWithHuggingFace(
  image: ImageInput
): Promise<HuggingFacePrediction[]> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured.");
  }

  const response = await fetch(HF_FOOD_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": image.mimeType,
    },
    body: new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Hugging Face request failed: ${details}`);
  }

  const result = (await response.json()) as unknown;
  if (!Array.isArray(result)) {
    throw new Error("Hugging Face returned an unexpected response.");
  }

  return result
    .filter(isHuggingFacePrediction)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

async function getNutritionWithGrok(labels: string[]): Promise<NutritionItem[]> {
  const apiKey =
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("XAI_API_KEY or GROK_API_KEY is not configured.");
  }

  const useGroqCompatibility =
    !process.env.XAI_API_KEY && !process.env.GROK_API_KEY && !!process.env.GROQ_API_KEY;
  const apiBaseUrl = useGroqCompatibility
    ? process.env.GROQ_API_BASE_URL || "https://api.groq.com/openai/v1"
    : process.env.GROK_API_BASE_URL || "https://api.x.ai/v1";
  const model = useGroqCompatibility
    ? process.env.GROQ_MODEL || "openai/gpt-oss-120b"
    : process.env.GROK_MODEL || "grok-3-mini";

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition API. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildFallbackNutritionPrompt(labels),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Grok nutrition request failed: ${details}`);
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = result.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Grok returned an empty nutrition response.");
  }

  return normalizeItems(parseItemsJson(text));
}

function buildFallbackNutritionPrompt(labels: string[]) {
  const cleanedLabels = labels.map(formatFoodName).join(", ");

  return `Hugging Face detected these likely food labels from an image: ${cleanedLabels}.

Estimate nutrition for the most likely major food items. Assume Indian food context if unclear.

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "",
      "portion": "",
      "quantity": "",
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
    }
  ]
}`;
}

function parseItemsJson(rawText: string): unknown {
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

function normalizeItems(payload: unknown): NutritionItem[] {
  if (!isItemsPayload(payload)) {
    throw new Error("Provider returned invalid food nutrition JSON.");
  }

  const items = payload.items
    .map((item) => {
      const quantityStr = normalizeText(item.quantity) || "100";
      const quantityMatch = quantityStr.match(/[\d.]+/);
      const quantity = quantityMatch ? Number(quantityMatch[0]) : 100;
      const multiplier = quantity / 100;

      const base = {
        calories: normalizeText(item.calories),
        protein: normalizeText(item.protein),
        carbs: normalizeText(item.carbs),
        fats: normalizeText(item.fats),
        fiber: normalizeText(item.fiber),
        sugar: normalizeText(item.sugar),
        micronutrients: normalizeMicronutrients(item.micronutrients),
      };

      const multiply = (val: string) => {
        const numMatch = val.match(/[\d.]+/);
        if (!numMatch) return val;
        const num = Number(numMatch[0]) * multiplier;
        return val.replace(/[\d.]+/, String(Math.round(num * 10) / 10));
      };

      return {
        name: normalizeText(item.name),
        portion: normalizeText(item.portion),
        quantity: quantityStr,
        calories: multiply(base.calories),
        protein: multiply(base.protein),
        carbs: multiply(base.carbs),
        fats: multiply(base.fats),
        fiber: multiply(base.fiber),
        sugar: multiply(base.sugar),
        micronutrients: {
          sodium: multiply(base.micronutrients.sodium),
          potassium: multiply(base.micronutrients.potassium),
          calcium: multiply(base.micronutrients.calcium),
          iron: multiply(base.micronutrients.iron),
          vitaminA: multiply(base.micronutrients.vitaminA),
          vitaminC: multiply(base.micronutrients.vitaminC),
        },
        baseNutrientsPer100g: base,
      };
    })
    .filter((item) => item.name.length > 0);

  if (items.length === 0) {
    throw new Error("Provider returned no food items.");
  }

  return items;
}

function normalizeText(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function normalizeMicronutrients(value: unknown): Micronutrients {
  const micronutrients =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    sodium: normalizeText(micronutrients.sodium),
    potassium: normalizeText(micronutrients.potassium),
    calcium: normalizeText(micronutrients.calcium),
    iron: normalizeText(micronutrients.iron),
    vitaminA: normalizeText(micronutrients.vitaminA),
    vitaminC: normalizeText(micronutrients.vitaminC),
  };
}

function isItemsPayload(payload: unknown): payload is { items: NutritionItem[] } {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("items" in payload) ||
    !Array.isArray((payload as { items: unknown }).items)
  ) {
    return false;
  }

  return (payload as { items: unknown[] }).items.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "portion" in item &&
      "quantity" in item &&
      "calories" in item &&
      "protein" in item &&
      "carbs" in item &&
      "fats" in item
  );
}

function isHuggingFacePrediction(
  prediction: unknown
): prediction is HuggingFacePrediction {
  return (
    typeof prediction === "object" &&
    prediction !== null &&
    "label" in prediction &&
    typeof (prediction as { label: unknown }).label === "string"
  );
}

function formatFoodName(label: string) {
  return label
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function jsonResponse(body: FoodDetectionResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function toProviderError(provider: string, error: unknown): ProviderError {
  return {
    provider,
    message: error instanceof Error ? error.message : "Unknown provider error",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
