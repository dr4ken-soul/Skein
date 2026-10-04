import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>404</p>
      <h1 className="font-serif text-3xl">Page not found</h1>
      <Link href="/" className="px-5 py-2 rounded-full border text-sm" style={{ borderColor: "var(--border)" }}>Go home</Link>
    </div>
  );
}
