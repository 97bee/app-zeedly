"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Wallet,
  PieChart,
  Rocket,
  Settings,
  TrendingUp,
  LogOut,
  ShieldCheck,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { getOpenfort } from "@/lib/openfort";

const NavItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/ipo", label: "IPOs", icon: Rocket },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CreatorItems = [
  { href: "/creator/apply", label: "Apply as Creator", icon: PenLine },
];

const AdminItems = [
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, clearAuth } = useAuthStore();

  async function handleLogout() {
    try { await getOpenfort().auth.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <TrendingUp className="h-7 w-7 text-emerald-500" />
        <span className="text-xl font-bold text-white">Zeedly</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-2 border-t border-zinc-800" />

        {[...CreatorItems, ...AdminItems].map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 pt-4">
        {email ? (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 group">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold">
              {email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-zinc-700" />
            <div className="flex-1 truncate">
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
