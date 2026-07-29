import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Jammy Jam",
  description: "Private Jammy Jam registration dashboard.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-surface">{children}</div>;
}
