"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/meal-log", label: "Meal Log", icon: "◷" },
  { href: "/profile", label: "Profile", icon: "○" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-4"
      aria-label="Primary navigation"
    >
      <div
        className="relative grid grid-cols-5 items-center rounded-[2rem] px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.94)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(18px)",
        }}
      >
        {navItems.map((item, index) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                index === 2 ? "col-start-5" : ""
              }`}
              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="col-start-3 row-start-1" />

        <Link
          href="/"
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl"
          aria-label="Scan image"
          style={{
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "0 12px 28px rgba(91,184,168,0.34)",
          }}
        >
          ◉
        </Link>
        <span
          className="pointer-events-none absolute left-1/2 top-[calc(50%+2.1rem)] -translate-x-1/2 text-[11px] font-medium"
          style={{ color: "var(--accent)" }}
        >
          Scan
        </span>
      </div>
    </nav>
  );
}
