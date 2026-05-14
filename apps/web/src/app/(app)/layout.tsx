import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-slate-950 dark:bg-[#0a0b0f] dark:text-slate-50 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px]">{children}</div>
      </main>
    </div>
  );
}
