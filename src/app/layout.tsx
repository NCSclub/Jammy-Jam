import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}