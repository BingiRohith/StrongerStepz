"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-6 py-16">
      <Card className="w-full max-w-md p-10 text-center">
        <p className="mb-2 text-5xl">❌</p>
        <h1 className="mb-3 font-heading text-2xl text-primary-dark">Payment Failed</h1>
        <p className="mb-8 text-ink-muted">
          Your payment didn&apos;t go through. No amount has been charged. You can try again or come back later — your
          registration is still on file.
        </p>

        <div className="flex flex-col gap-3">
          {registrationId && (
            <Button size="lg" onClick={() => router.push(`/payment/${registrationId}`)}>
              Retry Payment
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedContent />
    </Suspense>
  );
}
