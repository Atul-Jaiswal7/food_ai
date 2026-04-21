"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/app/components/BottomNav";

type MealRecord = {
  id: string;
  groupId?: string;
  groupName?: string;
  name: string;
  calories: string;
  servingSize: string;
  createdAt: string;
};

type MealGroup = {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  calories: number;
  items: MealRecord[];
};

export default function MealLogPage() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newMealPortion, setNewMealPortion] = useState("");
  const [newMealQtyGrams, setNewMealQtyGrams] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAddMeal = async () => {
    if (!newMealName) {
      setAddError("Please enter a meal name.");
      return;
    }
    try {
      const res = await fetch("/api/add-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMealName, quantity: newMealQty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add meal");
      setAddSuccess("Meal added successfully!");
      setNewMealName("");
      setNewMealQty("");
      // reload meals
      fetch("/api/meals")
        .then(r => r.json())
        .then(p => setMeals(p.meals))
        .catch(console.error);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    }
  };
  const mealGroups = useMemo(() => groupMeals(meals), [meals]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/meals")
      .then(async (response) => {
        if (!response.ok) throw new Error("Log in to see your meal history.");
        return response.json() as Promise<{ meals: MealRecord[] }>;
      })
      .then((payload) => {
        if (mounted) setMeals(payload.meals);
      })
      .catch((reason: Error) => {
        if (mounted) setError(reason.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your Log</h1>
        {addError && <p style={{ color: "var(--text-muted)" }}>{addError}</p>}
        {addSuccess && <p style={{ color: "var(--accent)" }}>{addSuccess}</p>}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="Portion (e.g., 1, 1.25)"
            value={newMealPortion}
            onChange={e => setNewMealPortion(e.target.value)}
            className="flex-1 rounded p-2"
          />
          <input
            type="number"
            placeholder="Quantity (g)"
            value={newMealQtyGrams}
            onChange={e => setNewMealQtyGrams(e.target.value)}
            className="w-24 rounded p-2"
          />
          <button
            onClick={handleAddMeal}
            className="rounded bg-var(--accent) text-white px-4"
          >
            Add
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {["Today", "Week", "Month"].map((label, index) => (
            <button
              key={label}
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: index === 0 ? "var(--accent)" : "var(--surface)",
                color: index === 0 ? "#fff" : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="skeleton h-80 rounded-[2rem]" />}

      {error && (
        <section className="rounded-[2rem] bg-white p-5">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <Link href="/login" className="mt-4 block rounded-2xl py-3 text-center text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            Log in
          </Link>
        </section>
      )}

      {!loading && !error && (
        <section className="flex flex-col gap-4">
          {mealGroups.map((group) => (
            <MealGroupCard key={group.id} group={group} />
          ))}
          {mealGroups.length === 0 && (
            <p className="rounded-[1.5rem] bg-white p-6 text-center text-sm shadow-sm border border-[var(--border)]" style={{ color: "var(--text-muted)" }}>
              No meals logged yet.
            </p>
          )}
        </section>
      )}

      <BottomNav />
    </main>
  );
}

function MealGroupCard({ group }: { group: MealGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-[1.5rem] bg-white p-4 shadow-sm border border-[var(--border)] transition-all">
      <div 
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[0.85rem] text-xl shadow-sm"
          style={{ background: "var(--surface-2)", color: "var(--accent)" }}
        >
          🍽️
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold">{group.name}</h2>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {group.itemCount} item{group.itemCount === 1 ? "" : "s"} ·{" "}
            {new Date(group.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{Math.round(group.calories)}</p>
          <p className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>kcal</p>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          {group.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Serving: {item.servingSize || "1 portion"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{item.calories.replace('kcal', '')}</p>
                <p className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>kcal</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}


function groupMeals(meals: MealRecord[]): MealGroup[] {
  const groups = new Map<string, MealGroup>();

  for (const meal of meals) {
    const id = meal.groupId || meal.id;
    const existing = groups.get(id);
    const calories = extractNumber(meal.calories);

    if (existing) {
      existing.itemCount += 1;
      existing.calories += calories;
      existing.items.push(meal);
      continue;
    }

    groups.set(id, {
      id,
      name: meal.groupName || meal.name,
      createdAt: meal.createdAt,
      itemCount: 1,
      calories,
      items: [meal],
    });
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function extractNumber(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}
