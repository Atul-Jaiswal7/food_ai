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
  const caloriesTarget = data?.targets.calories ?? "0";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, {data?.user?.name || "Aryan"}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {today}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: "#fde68a", color: "#92400e" }}
            >
              7-day streak
            </span>
          </div>
        </div>
        <Link
          href="/profile"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-semibold text-white shadow-sm"
          style={{ background: "var(--accent)" }}
          aria-label="Profile"
        >
          {data?.user?.name?.charAt(0).toUpperCase() || "A"}
        </Link>
      </header>

      {error && (
        <section className="rounded-[2rem] bg-white p-5 shadow-sm border border-[var(--border)]">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-2xl py-3 text-center text-sm font-semibold shadow-sm" style={buttonStyle}>
              Log in
            </Link>
            <Link href="/signup" className="rounded-2xl py-3 text-center text-sm font-semibold border border-[var(--border)]" style={outlineButtonStyle}>
              Sign up
            </Link>
          </div>
        </section>
      )}

      {!data && !error && <div className="skeleton h-80 rounded-[2rem]" />}

      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MacroCard
              title="CALORIES"
              current={caloriesTotal}
              target={caloriesTarget}
              progress={caloriesProgress}
              color="var(--accent)"
            />
            <MacroCard
              title="PROTEIN"
              current={Math.round(data.totals.protein ?? 0)}
              target={data.targets.protein ?? "0"}
              progress={data.progress.protein ?? 0}
              color="#3b82f6"
              unit="g"
            />
            <MacroCard
              title="CARBS"
              current={Math.round(data.totals.carbs ?? 0)}
              target={data.targets.carbs ?? "0"}
              progress={data.progress.carbs ?? 0}
              color="#f59e0b"
              unit="g"
            />
            <MacroCard
              title="FAT"
              current={Math.round(data.totals.fat ?? 0)}
              target={data.targets.fat ?? "0"}
              progress={data.progress.fat ?? 0}
              color="#ec4899"
              unit="g"
            />
          </div>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
            <h2 className="mb-4 text-base font-semibold">Macro breakdown</h2>
            <div className="flex items-center gap-6">
              <div
                className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${caloriesProgress * 3.6}deg, var(--surface-2) 0deg)`,
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
                  <div className="text-center">
                    <p className="text-xl font-bold leading-none">{caloriesTotal}</p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                      kcal
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <LegendItem color="#3b82f6" label="Protein" value={`${Math.round(data.totals.protein ?? 0)}g`} percent={data.progress.protein ?? 0} />
                <LegendItem color="#f59e0b" label="Carbs" value={`${Math.round(data.totals.carbs ?? 0)}g`} percent={data.progress.carbs ?? 0} />
                <LegendItem color="#ec4899" label="Fat" value={`${Math.round(data.totals.fat ?? 0)}g`} percent={data.progress.fat ?? 0} />
                <LegendItem color="var(--accent)" label="Fiber" value={`${Math.round(data.totals.fiber ?? 0)}g`} percent={data.progress.fiber ?? 0} />
              </div>
            </div>
          </section>

          <NutrientSection title="All Nutrients" rows={[...macroRows, ...microRows]} data={data} />

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Today&apos;s meals</h2>
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {data.todayMeals.length} logged
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {data.todayMeals.slice(0, 3).map((meal) => (
                <MealRow key={meal.id} meal={meal} />
              ))}
              {data.todayMeals.length === 0 && (
                <p className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                  No meals logged yet.
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

function MacroCard({ title, current, target, progress, color, unit = "" }: { title: string, current: number, target: string, progress: number, color: string, unit?: string }) {
  const percent = Math.min(progress, 100);
  return (
    <div className="flex flex-col rounded-[1rem] bg-white p-3 shadow-sm border border-[var(--border)]">
      <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</p>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="text-xl font-bold">{current}{unit}</span>
      </div>
      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>of {target}{unit} goal</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, value, percent }: { color: string, label: string, value: string, percent: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2 font-medium">
        <span>{value}</span>
        <span className="w-8 text-right opacity-50">{Math.round(percent)}%</span>
      </div>
    </div>
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
  const [expanded, setExpanded] = useState(false);
  const displayRows = expanded ? rows : rows.slice(0, 0); // Hide by default to save space, or show a few

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={() => setExpanded(!expanded)} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          {expanded ? "Hide" : "Show"}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 flex flex-col gap-4">
          {rows.map((row) => {
            const progress = Math.min(data.progress[row.key] ?? 0, 100);
            const total = Math.round((data.totals[row.key] ?? 0) * 10) / 10;
            return (
              <div key={row.key}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs font-medium">
                  <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span>
                    {total}{row.unit} <span className="opacity-40">/ {data.targets[row.key]}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--accent)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MealRow({ meal }: { meal: MealSummary }) {
  return (
    <Link href="/meal-log" className="flex items-center gap-3 rounded-[1rem] p-3 transition-colors active:scale-[0.98]" style={{ background: "var(--surface-2)" }}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[0.85rem] bg-white shadow-sm text-lg" style={{ color: "var(--accent)" }}>
        🍽️
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{meal.name}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
          {new Date(meal.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{meal.calories.replace('kcal', '')}</p>
        <p className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>kcal</p>
      </div>
    </Link>
  );
}

const buttonStyle = {
  background: "var(--accent)",
  color: "#fff",
};

const outlineButtonStyle = {
  background: "transparent",
  color: "var(--text)",
};
