import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chai & Cedar | 3D Land Studio",
  description:
    "A cinematic 3D property masterplan and private operating system for Chai & Cedar's nature-first asset buildout."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
