export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060709] p-4 font-[family-name:var(--font-geist-sans)] sm:p-6">
      <div className="w-full max-w-[980px]">{children}</div>
    </div>
  );
}
