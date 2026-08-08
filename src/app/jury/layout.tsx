import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jury Room | Jammy Jam", robots: { index: false, follow: false } };
export default function JuryLayout({ children }: { children: React.ReactNode }) { return children; }
