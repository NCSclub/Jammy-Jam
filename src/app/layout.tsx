import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * The pixel font the Figma file uses for every string in the digits section.
 * Self-hosted because it is not on any web font CDN; `next/font/local`
 * inlines the @font-face and preloads it, so there is no swap flash.
 */
const sonicHud = localFont({
  src: "./fonts/sonic-the-hedgehog-1-hud.otf",
  variable: "--font-sonic-hud",
  display: "swap",
  // The face has no real bold; let the browser know rather than synthesising one.
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = {
  title: "Jammy Jam",
  description: "Jammy Jam by the digits — participants, mentors and days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sonicHud.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
