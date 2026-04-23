"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/app/components/BottomNav";

import { MealRecord } from "@/lib/types";

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
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"Today" | "Week" | "Month">("Today");

  const filteredMeals = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const lastMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return meals.filter(meal => {
      const mealDate = new Date(meal.createdAt).getTime();
      if (timeFilter === "Today") return mealDate >= today;
      if (timeFilter === "Week") return mealDate >= lastWeek;
      if (timeFilter === "Month") return mealDate >= lastMonth;
      return true;
    });
  }, [meals, timeFilter]);

  const mealGroups = useMemo(() => groupMeals(filteredMeals), [filteredMeals]);

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

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {(["Today", "Week", "Month"] as const).map((label) => (
            <button
              key={label}
              onClick={() => setTimeFilter(label)}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95"
              style={{
                background: timeFilter === label ? "var(--accent)" : "var(--surface)",
                color: timeFilter === label ? "#fff" : "var(--text-muted)",
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
        <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          {group.items.map((item) => (
            <MealItemDetail key={item.id} item={item} />
          ))}
        </div>
      )}
    </article>
  );
}

function MealItemDetail({ item }: { item: MealRecord }) {
  const [showNutrients, setShowNutrients] = useState(false);

  return (
    <div 
      className="flex flex-col gap-2 rounded-xl p-3 transition-all" 
      style={{ background: "var(--surface-2)" }}
    >
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setShowNutrients(!showNutrients)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{item.name}</p>
          <p className="text-[10px] font-medium mt-0.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {item.servingSize || "1 portion"} · {item.quantity}g
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold">{item.calories.replace('kcal', '')}</p>
            <p className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>kcal</p>
          </div>
          <span className={`text-[10px] transition-transform ${showNutrients ? 'rotate-180' : ''}`} style={{ color: "var(--text-muted)" }}>
            ▼
          </span>
        </div>
      </div>

      {showNutrients && (
        <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-3 gap-2">
            <NutrientMini title="PRO" value={item.protein} color="#3b82f6" />
            <NutrientMini title="CARB" value={item.carbs} color="#f59e0b" />
            <NutrientMini title="FAT" value={item.fat} color="#ec4899" />
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            <MicroItem label="Fiber" value={item.fiber} />
            <MicroItem label="Sugar" value={item.sugar} />
            <MicroItem label="Sodium" value={item.sodium} />
            <MicroItem label="Potassium" value={item.potassium} />
          </div>
        </div>
      )}
    </div>
  );
}

function NutrientMini({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="rounded-lg bg-white p-2 text-center shadow-sm">
      <p className="text-[8px] font-bold tracking-tighter" style={{ color: "var(--text-muted)" }}>{title}</p>
      <p className="text-xs font-bold" style={{ color }}>{value.replace('g', '')}g</p>
    </div>
  );
}

function MicroItem({ label, value }: { label: string, value: string }) {
  if (!value || value === "0" || value === "0 mg" || value === "0 g") return null;
  return (
    <div className="flex justify-between text-[10px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
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
