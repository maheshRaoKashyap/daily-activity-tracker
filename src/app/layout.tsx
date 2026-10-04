import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIFE OS — 365-Day Performance System",
  description: "Personal operating system for goals, habits, career, learning, fitness, finance & investments",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
