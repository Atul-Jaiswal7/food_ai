"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(payload.error || "Unable to log in.");
      window.location.href = "/dashboard";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            Log in to continue tracking your daily nutrition.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          {error && <p className="text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>}
          <button
            className="mt-2 rounded-3xl py-4 text-base font-semibold"
            disabled={loading}
            style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No account yet?{" "}
          <Link href="/signup" style={{ color: "var(--accent)" }}>
            Sign up
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
