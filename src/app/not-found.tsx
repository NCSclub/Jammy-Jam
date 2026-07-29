import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found.</h1>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        Back home
      </Link>
    </main>
  );
}
