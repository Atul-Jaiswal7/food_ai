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
  const [loading, setLoading] = useState(true);
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
        <section className="flex flex-col gap-3">
          {mealGroups.map((group) => (
            <article key={group.id} className="rounded-[1.75rem] bg-white p-4">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl"
                  style={{ background: "#edf7f5", color: "var(--accent)" }}
                >
                  ◌
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{group.name}</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {group.itemCount} item{group.itemCount === 1 ? "" : "s"} ·{" "}
                    {new Date(group.createdAt).toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold">{Math.round(group.calories)} kcal</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full px-3 py-1 text-xs"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {mealGroups.length === 0 && (
            <p className="rounded-[2rem] bg-white p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Tap the camera to log your first meal
            </p>
          )}
        </section>
      )}

      <BottomNav />
    </main>
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
