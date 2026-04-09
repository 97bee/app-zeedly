"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Wallet,
  PieChart,
  Rocket,
  Settings,
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
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white px-4 py-6">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="text-xl font-bold tracking-tight text-zinc-900 font-mono">zeedly</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-lime/20 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-zinc-900")} />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-zinc-100" />

        {[...CreatorItems, ...AdminItems].map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-lime/20 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-zinc-900")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 pt-4">
        {email ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 group">
            <div className="h-8 w-8 rounded-full bg-lime/30 flex items-center justify-center text-zinc-900 text-xs font-semibold">
              {email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-zinc-100" />
            <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
