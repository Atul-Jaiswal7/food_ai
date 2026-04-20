"use client";

import { useState } from "react";

interface Micronutrients {
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
}

export interface EditableFoodItem {
  name: string;
  portion: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugar: string;
  quantity: number;
  micronutrients: Micronutrients;
}

interface ResultCardProps {
  groupName: string;
  items: EditableFoodItem[];
  source: "gemini" | "fallback";
  isSaving: boolean;
  recalculatingIndex: number | null;
  onGroupNameChange: (value: string) => void;
  onItemsChange: (items: EditableFoodItem[]) => void;
  onRecalculateItem: (index: number, item: EditableFoodItem) => Promise<void>;
  onSave: () => void;
}

const emptyItem = (): EditableFoodItem => ({
  name: "",
  portion: "1 serving",
  calories: "0 kcal",
  protein: "0 g",
  carbs: "0 g",
  fats: "0 g",
  fiber: "0 g",
  sugar: "0 g",
  quantity: 1,
  micronutrients: {
    sodium: "0 mg",
    potassium: "0 mg",
    calcium: "0 mg",
    iron: "0 mg",
    vitaminA: "0 mcg",
    vitaminC: "0 mg",
  },
});

const macroFields = [
  { key: "calories" as const, label: "Calories" },
  { key: "protein" as const, label: "Protein" },
  { key: "carbs" as const, label: "Carbs" },
  { key: "fats" as const, label: "Fats" },
  { key: "fiber" as const, label: "Fiber" },
  { key: "sugar" as const, label: "Sugar" },
];

const microFields = [
  { key: "sodium" as const, label: "Sodium" },
  { key: "potassium" as const, label: "Potassium" },
  { key: "calcium" as const, label: "Calcium" },
  { key: "iron" as const, label: "Iron" },
  { key: "vitaminA" as const, label: "Vitamin A" },
  { key: "vitaminC" as const, label: "Vitamin C" },
];

export default function ResultCard({
  groupName,
  items,
  source,
  isSaving,
  recalculatingIndex,
  onGroupNameChange,
  onItemsChange,
  onRecalculateItem,
  onSave,
}: ResultCardProps) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const totalCalories = Math.round(
    items.reduce((sum, item) => sum + extractNumber(item.calories), 0)
  );

  const updateItem = (index: number, patch: Partial<EditableFoodItem>) => {
    onItemsChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const updateQuantity = async (index: number, quantity: number) => {
    const nextItem = { ...items[index], quantity };
    updateItem(index, { quantity });

    if (nextItem.name.trim()) {
      await onRecalculateItem(index, nextItem);
    }
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section className="rounded-[2rem] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {source === "fallback" ? "Fallback" : "Gemini"} grouped result
          </p>
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none"
            aria-label="Meal group name"
          />
        </div>
        <div className="rounded-2xl px-3 py-2 text-right" style={{ background: "var(--surface-2)" }}>
          <p className="text-lg font-semibold">{totalCalories}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>kcal</p>
        </div>
      </div>

      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        Tap a food to view all macro and micro nutrients. Quantity changes recalculate with Groq.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {items.map((item, index) => (
          <article key={`${item.name}-${index}`} className="rounded-[1.5rem] p-4" style={{ background: "var(--surface-2)" }}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="min-w-0 flex-1 text-left"
              >
                <input
                  value={item.name}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => updateItem(index, { name: event.target.value })}
                  className="w-full bg-transparent text-base font-semibold outline-none"
                  placeholder="Food name"
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.calories} - {item.portion}
                </p>
              </button>
              <QuantityStepper
                value={item.quantity}
                disabled={recalculatingIndex === index}
                onChange={(quantity) => updateQuantity(index, quantity)}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-full px-3 py-2 text-sm"
                style={{ color: "#dc2626", background: "#fff" }}
              >
                Delete
              </button>
            </div>

            {expanded === index && (
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Portion / quantity note</span>
                  <input
                    value={item.portion}
                    onChange={(event) => updateItem(index, { portion: event.target.value })}
                    className="rounded-2xl bg-white px-4 py-3 outline-none"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onRecalculateItem(index, item)}
                  disabled={recalculatingIndex === index || !item.name.trim()}
                  className="rounded-2xl py-3 text-sm font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    opacity: recalculatingIndex === index || !item.name.trim() ? 0.65 : 1,
                  }}
                >
                  {recalculatingIndex === index ? "Fetching from Groq..." : "Fetch/Recalculate with Groq"}
                </button>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Macro nutrients
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {macroFields.map((field) => (
                      <EditableNutrient
                        key={field.key}
                        label={field.label}
                        value={item[field.key]}
                        onChange={(value) => updateItem(index, { [field.key]: value })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Micro nutrients
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {microFields.map((field) => (
                      <EditableNutrient
                        key={field.key}
                        label={field.label}
                        value={item.micronutrients[field.key]}
                        onChange={(value) =>
                          updateItem(index, {
                            micronutrients: {
                              ...item.micronutrients,
                              [field.key]: value,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          onItemsChange([...items, emptyItem()]);
          setExpanded(items.length);
        }}
        className="mt-4 w-full rounded-3xl py-3 text-sm font-semibold"
        style={{ background: "var(--surface-2)", color: "var(--accent)" }}
      >
        Add Food Item
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || items.length === 0}
        className="mt-3 w-full rounded-3xl py-4 text-base font-semibold"
        style={{
          background: "var(--accent)",
          color: "#fff",
          opacity: isSaving || items.length === 0 ? 0.6 : 1,
        }}
      >
        {isSaving ? "Saving..." : "Save Meal Group"}
      </button>
    </section>
  );
}

function QuantityStepper({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center rounded-full bg-white p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(0.25, Number((value - 0.25).toFixed(2))))}
        className="grid h-8 w-8 place-items-center rounded-full"
      >
        -
      </button>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Math.max(0.25, Number(event.target.value) || 1))}
        className="w-10 bg-transparent text-center text-sm font-semibold outline-none"
        aria-label="Quantity multiplier"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Number((value + 0.25).toFixed(2)))}
        className="grid h-8 w-8 place-items-center rounded-full"
      >
        +
      </button>
    </div>
  );
}

function EditableNutrient({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl bg-white p-3">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
      />
    </label>
  );
}

function extractNumber(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}
