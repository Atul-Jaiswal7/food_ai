"use client";

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

interface ResultCardProps {
  items: FoodDetectItem[];
  source: "gemini" | "fallback";
}

const macroFields = [
  { key: "calories" as const, label: "Calories", unit: "kcal", color: "#ff6b35" },
  { key: "protein" as const, label: "Protein", unit: "g", color: "#3b82f6" },
  { key: "carbs" as const, label: "Carbs", unit: "g", color: "#f59e0b" },
  { key: "fats" as const, label: "Fats", unit: "g", color: "#10b981" },
  { key: "fiber" as const, label: "Fiber", unit: "g", color: "#84cc16" },
  { key: "sugar" as const, label: "Sugar", unit: "g", color: "#ec4899" },
];

const microFields = [
  { key: "sodium" as const, label: "Sodium" },
  { key: "potassium" as const, label: "Potassium" },
  { key: "calcium" as const, label: "Calcium" },
  { key: "iron" as const, label: "Iron" },
  { key: "vitaminA" as const, label: "Vitamin A" },
  { key: "vitaminC" as const, label: "Vitamin C" },
];

export default function ResultCard({ items, source }: ResultCardProps) {
  return (
    <section
      className="animate-fade-in flex flex-col gap-4 rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Food Analysis
          </p>
          <h2
            className="font-display text-2xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {items.length} item{items.length === 1 ? "" : "s"} detected
          </h2>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
          style={{
            background: "rgba(16,185,129,0.15)",
            color: "#10b981",
          }}
        >
          {source === "fallback" ? "Fallback" : "Gemini"} result
        </span>
      </div>

      <div style={{ height: "1px", background: "var(--border)" }} />

      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <article
            key={`${item.name}-${index}`}
            className="rounded-2xl p-4 animate-fade-in"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              animationDelay: `${index * 0.08}s`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Item {index + 1}
                </p>
                <h3
                  className="text-xl font-semibold leading-tight mt-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.name}
                </h3>
              </div>
              {item.portion && (
                <span
                  className="text-xs px-2 py-1 rounded-full text-right"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {item.portion}
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                Macro nutrients
              </p>
              <div className="grid grid-cols-2 gap-2">
                {macroFields.map(({ key, label, unit, color }) => (
                  <div
                    key={key}
                    className="rounded-xl p-3"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                    <p className="text-lg font-semibold mt-1" style={{ color }}>
                      {formatNutritionValue(item[key], unit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                Micro nutrients
              </p>
              <div className="grid grid-cols-2 gap-2">
                {microFields.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <strong className="text-right" style={{ color: "var(--text)" }}>
                      {item.micronutrients[key] || "N/A"}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatNutritionValue(value: string, unit: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "N/A";
  }

  return trimmedValue.toLowerCase().includes(unit.toLowerCase())
    ? trimmedValue
    : `${trimmedValue} ${unit}`;
}
