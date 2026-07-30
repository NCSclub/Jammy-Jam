import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * The pixel font the Figma file uses for every string on the site.
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
  description:
    "Welcome to your favorite game. Register now for Jammy Jam and save your spot.",
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
