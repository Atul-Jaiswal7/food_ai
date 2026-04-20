"use client";

import { useState } from "react";
import CameraCapture from "@/app/components/CameraCapture";
import UploadImage from "@/app/components/UploadImage";
import ResultCard from "@/app/components/ResultCard";

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

export default function Home() {
  const [mode, setMode] = useState<Mode>("upload");
  const [step, setStep] = useState<Step>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [foodItems, setFoodItems] = useState<FoodDetectItem[]>([]);
  const [analysisSource, setAnalysisSource] = useState<"gemini" | "fallback" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState<string>("");

  const currentFile = mode === "upload" ? selectedFile : cameraFile;

  const handleAnalyze = async () => {
    const file = currentFile;
    if (!file) return;

    setStep("analyzing");
    setErrorMessage(null);
    setFoodItems([]);
    setAnalysisSource(null);
    setAnalyzeStep("Analyzing with Gemini...");

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

      setFoodItems(result.items);
      setAnalysisSource(result.source);
      setStep("done");
    } catch (err: unknown) {
      const e = err as Error;
      if (step !== "done") {
        setStep("error");
        setErrorMessage(e.message || "Something went wrong");
      }
    } finally {
      setAnalyzeStep("");
    }
  };

  const reset = () => {
    setStep("idle");
    setSelectedFile(null);
    setCameraFile(null);
    setFoodItems([]);
    setAnalysisSource(null);
    setErrorMessage(null);
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 0 3rem",
      }}
    >
      {/* Header */}
      <header
        className="w-full flex items-center justify-between px-4 py-4"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,10,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          maxWidth: "480px",
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.4rem" }}>🍱</span>
          <span
            className="font-semibold text-lg"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            NutriLens
          </span>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            background: "rgba(255,107,53,0.12)",
            color: "var(--accent)",
            border: "1px solid rgba(255,107,53,0.2)",
          }}
        >
          AI-Powered
        </span>
      </header>

      <div className="w-full flex flex-col gap-5 px-4 pt-5" style={{ maxWidth: "480px" }}>
        {/* Hero text */}
        <div>
          <h1
            className="text-3xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Snap food,
            <br />
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>know nutrition.</em>
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Powered by AI — optimised for Indian serving sizes.
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {(["upload", "camera"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className="py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-muted)",
              }}
            >
              {m === "upload" ? "📁 Upload" : "📷 Camera"}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {mode === "upload" ? (
            <UploadImage onSelect={setSelectedFile} selectedFile={selectedFile} />
          ) : (
            <CameraCapture onCapture={setCameraFile} />
          )}
        </div>

        {/* Analyze Button */}
        {currentFile && step !== "analyzing" && (
          <button
            onClick={handleAnalyze}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 0 30px rgba(255,107,53,0.3)",
            }}
          >
            ✨ Analyse Food
          </button>
        )}

        {/* Loading State */}
        {step === "analyzing" && (
          <div
            className="flex items-center justify-center gap-3 py-4 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="spinner" />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {analyzeStep || "Analyzing..."}
            </span>
          </div>
        )}

        {/* Error */}
        {step === "error" && errorMessage && (
          <div
            className="p-4 rounded-2xl text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
            }}
          >
            <p className="font-medium mb-1">⚠️ Error</p>
            <p style={{ color: "var(--text-muted)" }}>{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {foodItems.length > 0 && analysisSource && (
          <ResultCard
            items={foodItems}
            source={analysisSource}
          />
        )}

        {/* Reset */}
        {step === "done" && (
          <button
            onClick={reset}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: "var(--surface)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            🔄 Analyse Another Food
          </button>
        )}

        {/* Footer info */}
        <div className="text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            Gemini-first AI · HuggingFace fallback · Next.js PWA
          </p>
        </div>
      </div>
    </main>
  );
}
