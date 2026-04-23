"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-4"
      aria-label="Primary navigation"
    >
      <div
        className="relative grid grid-cols-3 items-center rounded-[2rem] px-2 py-2"
        style={{
          background: "rgba(255,255,255,0.94)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center gap-1 py-2 text-xs"
          style={{ color: pathname === "/dashboard" ? "var(--accent)" : "var(--text-muted)" }}
        >
          <span className="text-[1.35rem] leading-none mb-0.5">⌂</span>
          <span className="font-medium">Home</span>
        </Link>

        {/* Empty space for floating scan button */}
        <div />

        <Link
          href="/meal-log"
          className="flex flex-col items-center justify-center gap-1 py-2 text-xs"
          style={{ color: pathname === "/meal-log" ? "var(--accent)" : "var(--text-muted)" }}
        >
          <span className="text-[1.35rem] leading-none mb-0.5">◷</span>
          <span className="font-medium">Meal Log</span>
        </Link>

        {/* Floating Scan Button */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 flex h-[3.75rem] w-[3.75rem] -translate-x-1/2 -translate-y-[60%] items-center justify-center rounded-full text-2xl transition-transform active:scale-95"
          aria-label="Scan image"
          style={{
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(91,184,168,0.4)",
          }}
        >
          <div className="h-5 w-5 rounded-full border-[2.5px] border-white ring-4 ring-transparent ring-offset-2 ring-offset-white/20 transition-all"></div>
        </Link>
        <span
          className="pointer-events-none absolute left-1/2 top-[calc(50%+1.3rem)] -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: "var(--accent)" }}
        >
          Scan
        </span>
      </div>
    </nav>
  );
}
