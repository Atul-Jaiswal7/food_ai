"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import BottomNav from "@/app/components/BottomNav";

type Targets = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
};

type ProfilePayload = {
  user: {
    name: string;
    email: string;
    profile: {
      age: string;
      gender: string;
      height: string;
      weight: string;
      intakeTargets: Targets;
    };
  };
};

const goalFields = [
  { key: "calories" as const, label: "Daily Calories", unit: "kcal" },
  { key: "protein" as const, label: "Protein Target", unit: "g" },
  { key: "carbs" as const, label: "Carbs Target", unit: "g" },
  { key: "fat" as const, label: "Fats Target", unit: "g" },
  { key: "fiber" as const, label: "Fiber Target", unit: "g" },
  { key: "sugar" as const, label: "Sugar Target", unit: "g" },
  { key: "sodium" as const, label: "Sodium Target", unit: "mg" },
  { key: "potassium" as const, label: "Potassium Target", unit: "mg" },
  { key: "calcium" as const, label: "Calcium Target", unit: "mg" },
  { key: "iron" as const, label: "Iron Target", unit: "mg" },
  { key: "vitaminA" as const, label: "Vitamin A Target", unit: "mcg" },
  { key: "vitaminC" as const, label: "Vitamin C Target", unit: "mg" },
];

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [targets, setTargets] = useState<Targets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Log in to edit your profile.");
        return response.json() as Promise<ProfilePayload>;
      })
      .then((payload) => {
        if (!mounted) return;
        setName(payload.user.name);
        setEmail(payload.user.email);
        setAge(payload.user.profile.age);
        setGender(payload.user.profile.gender);
        setTargets(payload.user.profile.intakeTargets);
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

  const saveGoals = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targets) return;

    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, intakeTargets: targets }),
      });
      const payload = (await response.json()) as ProfilePayload & { error?: string };

      if (!response.ok) throw new Error(payload.error || "Unable to save profile.");

      setTargets(payload.user.profile.intakeTargets);
      setStatus("Goals updated successfully.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      </header>

      {loading && <div className="skeleton h-96 rounded-[1.5rem]" />}

      {error && !targets && (
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <Link href="/login" className="mt-4 block rounded-2xl py-3 text-center text-sm font-semibold shadow-sm" style={{ background: "var(--accent)", color: "#fff" }}>
            Log in
          </Link>
        </section>
      )}

      {targets && (
        <form onSubmit={saveGoals} className="flex flex-col gap-5">
          <section className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm border border-[var(--border)]">
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-full text-2xl font-bold shadow-inner"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {name.slice(0, 1).toUpperCase() || "U"}
            </div>
            <h2 className="mt-4 text-xl font-bold">{name}</h2>
            <p className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>
              {age ? `${age} years old` : "Age not set"}
            </p>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Details</h2>
            </div>
            <InfoRow label="Email" value={email} />
            <InfoRow label="Gender" value={gender || "Not set"} />
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm border border-[var(--border)]">
            <h2 className="mb-4 text-lg font-semibold">Nutrition Goals</h2>
            <div className="flex flex-col gap-4">
              {goalFields.map((field) => (
                <label key={field.key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {field.label}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={String(targets[field.key]).replace(/[^\d.]/g, '')}
                      onChange={(event) =>
                        setTargets((current) =>
                          current ? { ...current, [field.key]: `${event.target.value}${field.unit}` } : current
                        )
                      }
                      className="w-full rounded-xl border px-3 py-2.5 outline-none transition-colors focus:border-[var(--accent)]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: "var(--text-muted)" }}>
                      {field.unit}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <button
              className="mt-6 w-full rounded-2xl py-3.5 font-bold shadow-sm transition-opacity"
              disabled={saving}
              style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save Goals"}
            </button>
            {status && <p className="mt-3 text-center text-sm font-medium text-emerald-600">{status}</p>}
            {error && <p className="mt-3 text-center text-sm font-medium text-red-500">{error}</p>}
          </section>

          <button
            type="button"
            onClick={logout}
            className="py-4 text-center text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Log Out
          </button>
        </form>
      )}

      <BottomNav />
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t py-4 first:border-t-0" style={{ borderColor: "var(--border)" }}>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
