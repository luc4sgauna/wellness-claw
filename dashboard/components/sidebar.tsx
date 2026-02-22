"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/timeline", label: "Timeline", icon: "clock" },
  { href: "/dashboard/oura", label: "Oura Trends", icon: "activity" },
  { href: "/dashboard/goals", label: "Goals", icon: "target" },
  { href: "/dashboard/streaks", label: "Streaks", icon: "flame" },
];

const icons: Record<string, string> = {
  grid: "M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z",
  clock:
    "M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  activity:
    "M22 12h-4l-3 9L9 3l-3 9H2",
  scatter:
    "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0m-5-3m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0m10 6m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0m-3-8m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0m-6 8m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0",
  target:
    "M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0m10-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12m0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  flame:
    "M12 2c1 4-2 7-2 7s3-1 4 2c1 3-2 6-4 7-2-1-5-4-4-7 0 0 3-3 2-7s3-2 4-2z",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">Wellness</h1>
        <p className="text-xs text-gray-400">Dashboard</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={icons[item.icon]} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
