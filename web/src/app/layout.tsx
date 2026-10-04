import type { Metadata } from "next";
import "@/styles/globals.css";
import { RulerNav } from "@/components/layout/RulerNav";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SkeinScene } from "@/components/three/SkeinScene";

export const metadata: Metadata = {
  title: "Skein — An invoice can only be financed once",
  description: "A neutral on-chain registry that stops one invoice from being financed twice. Built on Arc.",
  openGraph: {
    title: "Skein",
    description: "An invoice can only be financed once.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Favicon slot: replace with public/favicon.ico once provided */}
        <ErrorBoundary>
          <RulerNav />
          <SkeinScene />
          <main className="relative pt-16">{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
