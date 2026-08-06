import type { Metadata } from "next";

const canonicalUrl = "https://jammy-jam.vercel.app/links";
const socialImage = "https://jammy-jam.vercel.app/og-pixel.png";
const description =
  "Retrouvez Jammy Jam et la Numidia Computer Society sur tous leurs réseaux.";

export const metadata: Metadata = {
  title: "Jammy Jam | Links",
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Jammy Jam | Links",
    description,
    type: "website",
    locale: "fr_DZ",
    url: canonicalUrl,
    images: [{ url: socialImage, width: 1730, height: 909, alt: "Jammy Jam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jammy Jam | Links",
    description,
    images: [socialImage],
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
