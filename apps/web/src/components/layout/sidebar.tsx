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
  { href: "/offerings", label: "Offerings", icon: Rocket },
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

const sections = [
  { label: "Market", items: NavItems.slice(0, 3) },
  { label: "Account", items: NavItems.slice(3) },
  { label: "Creator", items: [...CreatorItems, ...AdminItems] },
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
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-white/5 bg-[#0d0f14] px-3 py-5">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-sm font-black tracking-[-0.08em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          z
        </span>
        <span className="text-lg font-black tracking-[-0.06em] text-white">zeedly</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all",
                      isActive
                        ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white/80",
                    )}
                  >
                    <item.icon className={cn("h-[17px] w-[17px]", isActive ? "text-lime" : "text-white/40")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4">
        {email ? (
          <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-black text-slate-950">
              {email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white/90">{email}</p>
              <p className="text-[11px] text-white/30">Investor account</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 opacity-0 transition-all hover:text-red-300 group-hover:opacity-100"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div className="h-8 w-8 rounded-full bg-white/10" />
            <Link href="/login" className="text-sm font-semibold text-white/60 transition-colors hover:text-white">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
