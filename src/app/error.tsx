"use client";

import { useEffect } from "react";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong.
      </h1>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-current px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
      >
        Try again
      </button>
    </main>
  );
}
