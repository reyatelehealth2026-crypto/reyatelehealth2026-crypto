import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Auto-Post · Gemini",
  description: "ระบบโพสต์ Facebook Page อัตโนมัติด้วย Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
