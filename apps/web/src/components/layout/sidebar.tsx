"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Wallet,
  PieChart,
  Settings,
  LogOut,
  ShieldCheck,
  PenLine,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { getOpenfort } from "@/lib/openfort";

const NavItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CreatorItems = [{ href: "/creator/apply", label: "Apply as Creator", icon: PenLine }];
const AdminItems = [{ href: "/admin", label: "Admin", icon: ShieldCheck }];

const sections = [
  { label: "Market", items: NavItems.slice(0, 2) },
  { label: "Account", items: NavItems.slice(2) },
  { label: "Creator", items: [...CreatorItems, ...AdminItems] },
];

function SidebarBody({
  onNavigate,
  onLogout,
  email,
  pathname,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  email: string | null;
  pathname: string;
}) {
  return (
    <>
      <Link href="/" onClick={onNavigate} className="mb-7 flex items-center gap-2.5 px-2">
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
                    onClick={onNavigate}
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
              onClick={onLogout}
              className="text-white/30 transition-all hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div className="h-8 w-8 rounded-full bg-white/10" />
            <Link href="/login" onClick={onNavigate} className="text-sm font-semibold text-white/60 transition-colors hover:text-white">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  async function handleLogout() {
    try {
      await getOpenfort().auth.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    router.push("/login");
  }

  return (
    <>
      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-[12px] font-black tracking-[-0.08em] text-white">
            z
          </span>
          <span className="text-[15px] font-black tracking-[-0.06em] text-slate-950">zeedly</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-white/5 bg-[#0d0f14] px-3 py-5 lg:flex">
        <SidebarBody email={email} pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#0d0f14] px-3 py-4 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody
                email={email}
                pathname={pathname}
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
