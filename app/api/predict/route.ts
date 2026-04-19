import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HF_API_KEY not configured" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hfResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/nateraw/food",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "image/jpeg",
        },
        body: buffer,
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error("HF API error:", errText);
      return NextResponse.json(
        { error: "Failed to classify image", details: errText },
        { status: hfResponse.status }
      );
    }

    const results = await hfResponse.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No predictions returned" },
        { status: 500 }
      );
    }

    const top = results[0] as { label: string; score: number };

    return NextResponse.json({
      label: top.label,
      score: top.score,
      displayName: formatFoodName(top.label),
      allPredictions: results.slice(0, 3),
    });
  } catch (err) {
    console.error("Predict error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatFoodName(label: string): string {
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
