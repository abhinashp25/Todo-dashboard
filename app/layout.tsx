import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TASKOPS — Real-time Dashboard",
  description: "Live agent task monitoring powered by Supabase Realtime",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
