"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Root error boundary — catches anything thrown while rendering a Server or
 * Client Component that isn't already handled locally (e.g. a malformed id
 * causing a Mongoose CastError, or a MongoDB outage). Next.js only shows this
 * in production; details are logged server-side, never rendered to the user.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-6 py-16">
      <Card className="w-full max-w-md p-10 text-center">
        <p className="mb-2 text-5xl">⚠️</p>
        <h1 className="mb-3 font-heading text-2xl text-primary-dark">Something Went Wrong</h1>
        <p className="mb-8 text-ink-muted">
          We hit an unexpected problem loading this page. Please try again — if it keeps happening, contact us.
        </p>
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => reset()}>
            Try Again
          </Button>
          <Button variant="secondary" size="lg" onClick={() => (window.location.href = "/")}>
            Return Home
          </Button>
        </div>
      </Card>
    </main>
  );
}
