"use client";

import { NutritionData } from "@/app/api/nutrition/route";

interface Prediction {
  label: string;
  score: number;
  displayName: string;
  allPredictions?: Array<{ label: string; score: number }>;
}

interface ResultCardProps {
  prediction: Prediction;
  nutrition: NutritionData | null;
  isLoadingNutrition: boolean;
}

const macros = [
  { key: "calories" as const, label: "Calories", emoji: "🔥", color: "#ff6b35" },
  { key: "protein" as const, label: "Protein", emoji: "💪", color: "#3b82f6" },
  { key: "carbs" as const, label: "Carbs", emoji: "🌾", color: "#f59e0b" },
  { key: "fat" as const, label: "Fat", emoji: "🫒", color: "#10b981" },
];

export default function ResultCard({
  prediction,
  nutrition,
  isLoadingNutrition,
}: ResultCardProps) {
  const confidence = Math.round(prediction.score * 100);

  return (
    <div
      className="animate-fade-in flex flex-col gap-4 rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Food Name */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Detected Food
          </p>
          <h2
            className="font-display text-2xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {prediction.displayName}
          </h2>
        </div>
        <div
          className="flex flex-col items-end gap-1 shrink-0"
        >
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background:
                confidence >= 80
                  ? "rgba(16,185,129,0.15)"
                  : confidence >= 50
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(239,68,68,0.15)",
              color:
                confidence >= 80
                  ? "#10b981"
                  : confidence >= 50
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          >
            {confidence}% confident
          </span>
          {/* Confidence bar */}
          <div
            className="w-20 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--surface-2)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${confidence}%`,
                background:
                  confidence >= 80
                    ? "#10b981"
                    : confidence >= 50
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Nutrition Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Nutrition per serving
          </p>
          {nutrition?.servingSize && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ~{nutrition.servingSize}
            </span>
          )}
        </div>

        {isLoadingNutrition ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton h-20 rounded-xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : nutrition ? (
          <div className="grid grid-cols-2 gap-3">
            {macros.map(({ key, label, emoji, color }, idx) => (
              <div
                key={key}
                className="rounded-xl p-3 flex flex-col gap-1 animate-fade-in"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  animationDelay: `${idx * 0.08}s`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: "1rem" }}>{emoji}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                </div>
                <p
                  className="text-lg font-semibold"
                  style={{ color, fontFamily: "var(--font-body)" }}
                >
                  {nutrition[key]}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {nutrition?.fiber && (
          <div
            className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "var(--surface-2)" }}
          >
            <span>🥗</span>
            <span style={{ color: "var(--text-muted)" }}>
              Fiber: <strong style={{ color: "var(--text)" }}>{nutrition.fiber}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Other predictions */}
      {prediction.allPredictions && prediction.allPredictions.length > 1 && (
        <>
          <div style={{ height: "1px", background: "var(--border)" }} />
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Other possibilities
            </p>
            <div className="flex flex-col gap-1.5">
              {prediction.allPredictions.slice(1).map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(p.score * 100)}%`,
                        background: "var(--border)",
                        filter: "brightness(1.5)",
                      }}
                    />
                  </div>
                  <span className="text-xs w-24 truncate" style={{ color: "var(--text-muted)" }}>
                    {p.label.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs w-8 text-right" style={{ color: "var(--text-muted)" }}>
                    {Math.round(p.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
