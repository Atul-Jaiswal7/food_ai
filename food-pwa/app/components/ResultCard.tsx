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
  quantity: string;
  micronutrients: Micronutrients;
  baseNutrientsPer100g?: {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
    fiber: string;
    sugar: string;
    micronutrients: Micronutrients;
  };
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
  portion: "1",
  calories: "0 kcal",
  protein: "0 g",
  carbs: "0 g",
  fats: "0 g",
  fiber: "0 g",
  sugar: "0 g",
  quantity: "100",
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
    onItemsChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        
        let updatedItem = { ...item, ...patch };

        // If quantity changed and we have base nutrients, recalculate everything locally
        if (patch.quantity !== undefined && item.baseNutrientsPer100g) {
          const newQuantity = extractNumber(patch.quantity);
          const multiplier = newQuantity / 100;
          const base = item.baseNutrientsPer100g;

          const multiply = (val: string) => {
            const numMatch = val.match(/[\d.]+/);
            if (!numMatch) return val;
            const num = Number(numMatch[0]) * multiplier;
            return val.replace(/[\d.]+/, String(Math.round(num * 10) / 10));
          };

          updatedItem = {
            ...updatedItem,
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
          };
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            {source === "fallback" ? "Fallback" : "AI"} Analysis
          </p>
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            className="mt-1 w-full bg-transparent text-2xl font-bold outline-none"
            aria-label="Meal group name"
          />
        </div>
        <div className="rounded-[1rem] px-4 py-2 text-center shadow-sm border border-[var(--border)]" style={{ background: "var(--surface-2)" }}>
          <p className="text-xl font-bold">{totalCalories}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>kcal</p>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Tap a food item to view and edit its macro and micro nutrients.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {items.map((item, index) => (
          <article key={index} className="rounded-[1.25rem] p-4 shadow-sm border border-[var(--border)] transition-all" style={{ background: "var(--bg)" }}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="rounded-xl border px-3 py-2 transition-colors focus-within:border-[var(--accent)]" style={{ borderColor: "var(--border)", background: "white" }}>
                  <input
                    value={item.name}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                    className="w-full bg-transparent text-base font-bold outline-none"
                    placeholder="Enter food name..."
                  />
                </div>
                <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {item.calories} • {item.portion} portion(s) • {item.quantity}g
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition-opacity active:opacity-70"
                style={{ color: "#dc2626", background: "#fee2e2" }}
              >
                Delete
              </button>
            </div>

            {expanded === index && (
              <div className="mt-4 pt-4 flex flex-col gap-4 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Portion (no.)</span>
                    <input
                      type="number"
                      step="any"
                      value={item.portion}
                      onChange={(event) => updateItem(index, { portion: event.target.value })}
                      className="rounded-xl border px-3 py-2.5 outline-none transition-colors focus:border-[var(--accent)]"
                      style={{ borderColor: "var(--border)", background: "white" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Quantity (grams)</span>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      className="rounded-xl border px-3 py-2.5 outline-none transition-colors focus:border-[var(--accent)]"
                      style={{ borderColor: "var(--border)", background: "white" }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => onRecalculateItem(index, item)}
                  disabled={recalculatingIndex === index || !item.name.trim()}
                  className="rounded-xl py-3 text-sm font-bold shadow-sm transition-opacity"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    opacity: recalculatingIndex === index || !item.name.trim() ? 0.65 : 1,
                  }}
                >
                  {recalculatingIndex === index ? "Recalculating..." : "Recalculate Nutrition"}
                </button>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider mt-2" style={{ color: "var(--text-muted)" }}>
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
        className="mt-4 w-full rounded-2xl py-3 text-sm font-bold shadow-sm border border-[var(--border)] transition-opacity active:opacity-70"
        style={{ background: "white", color: "var(--text)" }}
      >
        + Add Food Item
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || items.length === 0}
        className="mt-3 w-full rounded-2xl py-4 text-base font-bold shadow-sm transition-opacity"
        style={{
          background: "var(--text)",
          color: "#fff",
          opacity: isSaving || items.length === 0 ? 0.6 : 1,
        }}
      >
        {isSaving ? "Saving..." : "Save Meal Log"}
      </button>
    </section>
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
    <label className="rounded-xl p-2.5 shadow-sm border border-[var(--border)]" style={{ background: "white" }}>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-0.5 w-full bg-transparent text-sm font-bold outline-none"
      />
    </label>
  );
}

function extractNumber(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}
