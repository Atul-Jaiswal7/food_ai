"use client";

import Link from "next/link";
import { useState } from "react";
import CameraCapture from "@/app/components/CameraCapture";
import ResultCard, { EditableFoodItem } from "@/app/components/ResultCard";
import UploadImage from "@/app/components/UploadImage";

type Mode = "upload" | "camera";
type Step = "idle" | "analyzing" | "done" | "error";

interface Micronutrients {
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
}

interface FoodDetectItem {
  name: string;
  portion: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugar: string;
  micronutrients: Micronutrients;
}

interface FoodDetectResponse {
  success: boolean;
  source: "gemini" | "fallback";
  items: FoodDetectItem[];
  error?: string;
}

export default function ScanPage() {
  const [mode, setMode] = useState<Mode>("upload");
  const [step, setStep] = useState<Step>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [foodItems, setFoodItems] = useState<EditableFoodItem[]>([]);
  const [analysisSource, setAnalysisSource] = useState<"gemini" | "fallback" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("Scanned meal");
  const [isSaving, setIsSaving] = useState(false);
  const [recalculatingIndex, setRecalculatingIndex] = useState<number | null>(null);

  const currentFile = mode === "upload" ? selectedFile : cameraFile;

  const handleAnalyze = async () => {
    const file = currentFile;
    if (!file) return;

    setStep("analyzing");
    setErrorMessage(null);
    setFoodItems([]);
    setAnalysisSource(null);
    setSaveMessage(null);
    setGroupName("Scanned meal");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const foodDetectRes = await fetch("/api/food-detect", {
        method: "POST",
        body: formData,
      });
      const result = (await foodDetectRes.json()) as FoodDetectResponse;

      if (!foodDetectRes.ok || !result.success || result.items.length === 0) {
        throw new Error(result.error || "Failed to analyze food");
      }

      setFoodItems(result.items.map((item) => ({ ...item, quantity: "100" })));
      setGroupName(getGroupName(result.items));
      setAnalysisSource(result.source);
      setStep("done");
    } catch (err: unknown) {
      const e = err as Error;
      setStep("error");
      setErrorMessage(e.message || "Something went wrong");
    }
  };

  const saveMeals = async (items: EditableFoodItem[]) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          items,
        }),
      });
      setSaveMessage(response.ok ? "Saved to Meal Log." : "Log in to save this meal.");
    } catch {
      setSaveMessage("Analysis complete. Meal was not saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const recalculateItem = async (index: number, item: EditableFoodItem) => {
    if (!item.name.trim()) return;

    setRecalculatingIndex(index);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/food-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          portion: item.portion,
          quantity: item.quantity,
        }),
      });
      const payload = (await response.json()) as {
        item?: Omit<EditableFoodItem, "quantity">;
        error?: string;
      };

      if (!response.ok || !payload.item) {
        throw new Error(payload.error || "Unable to recalculate nutrition.");
      }

      const recalculatedItem = payload.item;
      setFoodItems((current) =>
        current.map((currentItem, currentIndex) =>
          currentIndex === index
            ? {
                ...recalculatedItem,
                quantity: item.quantity,
              }
            : currentItem
        )
      );
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Unable to recalculate nutrition."
      );
    } finally {
      setRecalculatingIndex(null);
    }
  };

  const reset = () => {
    setStep("idle");
    setSelectedFile(null);
    setCameraFile(null);
    setFoodItems([]);
    setAnalysisSource(null);
    setErrorMessage(null);
    setSaveMessage(null);
    setGroupName("Scanned meal");
    setIsSaving(false);
    setRecalculatingIndex(null);
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-8 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Scan Image</p>
          <h1 className="text-3xl font-semibold tracking-tight">Analyze Meal</h1>
        </div>
        <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: "var(--surface)", color: "var(--text)" }}>
          Home
        </Link>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-2 rounded-[2rem] bg-white p-1">
        {(["upload", "camera"] as Mode[]).map((item) => (
          <button
            key={item}
            onClick={() => {
              setMode(item);
              reset();
            }}
            className="rounded-[1.6rem] py-3 text-sm font-semibold"
            style={{
              background: mode === item ? "var(--accent)" : "transparent",
              color: mode === item ? "#fff" : "var(--text-muted)",
            }}
          >
            {item === "upload" ? "Upload" : "Camera"}
          </button>
        ))}
      </section>

      <section className="rounded-[2rem] bg-white p-4">
        {mode === "upload" ? (
          <UploadImage onSelect={setSelectedFile} selectedFile={selectedFile} />
        ) : (
          <CameraCapture onCapture={setCameraFile} />
        )}
      </section>

      {currentFile && step !== "analyzing" && (
        <button
          onClick={handleAnalyze}
          className="mt-5 w-full rounded-3xl py-4 text-base font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Analyze Food
        </button>
      )}

      {step === "analyzing" && (
        <div className="mt-5 flex items-center justify-center gap-3 rounded-3xl bg-white py-4">
          <div className="spinner" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Analyzing with Gemini...
          </span>
        </div>
      )}

      {step === "error" && errorMessage && (
        <div className="mt-5 rounded-3xl bg-white p-5 text-center">
          <p className="text-sm" style={{ color: "#dc2626" }}>{errorMessage}</p>
        </div>
      )}

      {foodItems.length > 0 && analysisSource && (
        <div className="mt-5">
          <ResultCard
            groupName={groupName}
            items={foodItems}
            source={analysisSource}
            isSaving={isSaving}
            recalculatingIndex={recalculatingIndex}
            onGroupNameChange={setGroupName}
            onItemsChange={setFoodItems}
            onRecalculateItem={recalculateItem}
            onSave={() => saveMeals(foodItems)}
          />
        </div>
      )}

      {saveMessage && (
        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {saveMessage}
        </p>
      )}

      {step === "done" && (
        <button
          onClick={reset}
          className="mt-4 w-full rounded-3xl bg-white py-4 text-sm font-semibold"
          style={{ color: "var(--text)" }}
        >
          Analyze Another Meal
        </button>
      )}
    </main>
  );
}

function getGroupName(items: FoodDetectItem[]) {
  const names = items
    .map((item) => item.name.trim())
    .filter(Boolean)
    .slice(0, 2);

  return names.length > 0 ? names.join(" + ") : "Scanned meal";
}
