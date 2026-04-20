"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/app/components/BottomNav";

type NutrientKey =
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "fiber"
  | "sugar"
  | "sodium"
  | "potassium"
  | "calcium"
  | "iron"
  | "vitaminA"
  | "vitaminC";

type MealSummary = {
  id: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  servingSize: string;
  createdAt: string;
};

type DashboardData = {
  user: { name: string };
  meals: MealSummary[];
  todayMeals: MealSummary[];
  totals: Record<NutrientKey, number>;
  targets: Record<NutrientKey, string>;
  progress: Record<NutrientKey, number>;
};

const macroRows: Array<{ key: NutrientKey; label: string; unit: string }> = [
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fats", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
];

const microRows: Array<{ key: NutrientKey; label: string; unit: string }> = [
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  useEffect(() => {
    let mounted = true;

    fetch("/api/dashboard")
      .then(async (response) => {
        if (!response.ok) throw new Error("Log in to view your dashboard.");
        return response.json() as Promise<DashboardData>;
      })
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((reason: Error) => {
        if (mounted) setError(reason.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const caloriesProgress = Math.min(data?.progress.calories ?? 0, 100);
  const caloriesTotal = Math.round(data?.totals.calories ?? 0);
  const caloriesTarget = data?.targets.calories ?? "0 kcal";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-6">
      <header className="mb-6">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {today}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Hello, {data?.user.name || "there"}
        </h1>
      </header>

      {error && (
        <section className="rounded-[2rem] bg-white p-5">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-2xl py-3 text-center text-sm font-semibold" style={buttonStyle}>
              Log in
            </Link>
            <Link href="/signup" className="rounded-2xl py-3 text-center text-sm font-semibold" style={outlineButtonStyle}>
              Sign up
            </Link>
          </div>
        </section>
      )}

      {!data && !error && <div className="skeleton h-80 rounded-[2rem]" />}

      {data && (
        <div className="flex flex-col gap-5">
          <section className="rounded-[2rem] bg-white p-6 text-center">
            <div
              className="mx-auto grid h-52 w-52 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--accent) ${caloriesProgress * 3.6}deg, var(--surface-2) 0deg)`,
              }}
            >
              <div className="grid h-40 w-40 place-items-center rounded-full bg-white">
                <div>
                  <p className="text-4xl font-semibold">{caloriesTotal}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    of {caloriesTarget}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Calories eaten vs goal
            </p>
          </section>

          <NutrientSection title="Macros" rows={macroRows} data={data} />
          <NutrientSection title="Micronutrients" rows={microRows} data={data} />

          <section className="rounded-[2rem] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today&apos;s Meals</h2>
              <Link href="/meal-log" className="text-sm" style={{ color: "var(--accent)" }}>
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {data.todayMeals.slice(0, 2).map((meal) => (
                <MealRow key={meal.id} meal={meal} />
              ))}
              {data.todayMeals.length === 0 && (
                <p className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                  Tap the camera to log your first meal
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function NutrientSection({
  title,
  rows,
  data,
}: {
  title: string;
  rows: Array<{ key: NutrientKey; label: string; unit: string }>;
  data: DashboardData;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-4">
        {rows.map((row) => {
          const progress = Math.min(data.progress[row.key] ?? 0, 100);
          const total = Math.round((data.totals[row.key] ?? 0) * 10) / 10;
          return (
            <div key={row.key}>
              <div className="mb-2 flex justify-between gap-3 text-sm">
                <span>{row.label}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {total}{row.unit} / {data.targets[row.key]}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "var(--accent)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MealRow({ meal }: { meal: MealSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--surface-2)" }}>
      <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "#dcefed", color: "var(--accent)" }}>
        o
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{meal.name}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(meal.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <p className="text-sm font-semibold">{meal.calories}</p>
    </div>
  );
}

const buttonStyle = {
  background: "var(--accent)",
  color: "#fff",
};

const outlineButtonStyle = {
  background: "var(--surface-2)",
  color: "var(--text)",
};
