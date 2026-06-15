import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FTA Link Shortener",
  description:
    "Frank Taylor & Associates — branded link shortener with per-company links and click tracking.",
  icons: { icon: "/favicon.ico" },
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
