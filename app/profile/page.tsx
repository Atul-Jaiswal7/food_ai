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
  { key: "calories" as const, label: "Daily Calories" },
  { key: "protein" as const, label: "Protein Target" },
  { key: "carbs" as const, label: "Carbs Target" },
  { key: "fat" as const, label: "Fats Target" },
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
      setStatus("Goals updated");
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

      {loading && <div className="skeleton h-96 rounded-[2rem]" />}

      {error && !targets && (
        <section className="rounded-[2rem] bg-white p-5">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <Link href="/login" className="mt-4 block rounded-2xl py-3 text-center text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            Log in
          </Link>
        </section>
      )}

      {targets && (
        <form onSubmit={saveGoals} className="flex flex-col gap-5">
          <section className="rounded-[2rem] bg-white p-6 text-center">
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-full text-2xl font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--accent)" }}
            >
              {name.slice(0, 1).toUpperCase() || "U"}
            </div>
            <h2 className="mt-4 text-xl font-semibold">{name}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {age ? `${age} years old` : "Age not set"}
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Details</h2>
              <span style={{ color: "var(--accent)" }}>✎</span>
            </div>
            <InfoRow label="Email" value={email} />
            <InfoRow label="Gender" value={gender || "Not set"} />
          </section>

          <section className="rounded-[2rem] bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">Goals</h2>
            <div className="flex flex-col gap-3">
              {goalFields.map((field) => (
                <label key={field.key} className="flex flex-col gap-2">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {field.label}
                  </span>
                  <input
                    value={targets[field.key]}
                    onChange={(event) =>
                      setTargets((current) =>
                        current ? { ...current, [field.key]: event.target.value } : current
                      )
                    }
                    className="rounded-2xl px-4 py-3 outline-none"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text)",
                    }}
                  />
                </label>
              ))}
            </div>
            <button
              className="mt-5 w-full rounded-3xl py-4 font-semibold"
              disabled={saving}
              style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save Goals"}
            </button>
            {status && <p className="mt-3 text-center text-sm" style={{ color: "var(--accent)" }}>{status}</p>}
            {error && <p className="mt-3 text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>}
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
