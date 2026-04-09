import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 text-zinc-900">{children}</main>
    </div>
  );
}
