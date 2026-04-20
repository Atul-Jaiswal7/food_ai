"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    gender: "Female",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create account.");
      }

      window.location.href = "/dashboard";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ background: "var(--surface)", color: "var(--accent)" }}
          >
            ◉
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            Start tracking calories, macros, and nutrients in a few taps.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Full Name" value={form.name} onChange={(value) => update("name", value)} />
          <Field label="Email" value={form.email} onChange={(value) => update("email", value)} type="email" />
          <Field label="Age" value={form.age} onChange={(value) => update("age", value)} type="number" />

          <div className="rounded-3xl bg-white p-1">
            <p className="px-3 pt-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Gender
            </p>
            <div className="grid grid-cols-3 gap-1 p-1">
              {["Female", "Male", "Other"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("gender", option)}
                  className="rounded-2xl py-3 text-sm font-medium"
                  style={{
                    background: form.gender === option ? "var(--accent)" : "transparent",
                    color: form.gender === option ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Password"
            value={form.password}
            onChange={(value) => update("password", value)}
            type="password"
          />

          {error && <p className="text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>}

          <button
            className="mt-2 rounded-3xl py-4 text-base font-semibold"
            disabled={loading}
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-3xl bg-white px-4 py-3">
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-base outline-none"
        style={{ color: "var(--text)" }}
      />
    </label>
  );
}
