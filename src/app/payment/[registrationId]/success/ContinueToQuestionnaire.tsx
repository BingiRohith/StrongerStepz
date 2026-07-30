"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const AUTO_REDIRECT_MS = 2500;

/** Payment success is a checkpoint, not an endpoint — this carries the user on to the questionnaire automatically, with a manual fallback in case the timed redirect doesn't fire. */
export function ContinueToQuestionnaire({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const href = `/questionnaire/${registrationId}`;

  useEffect(() => {
    const timer = setTimeout(() => router.push(href), AUTO_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [router, href]);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-sm text-ink-muted">Taking you to a quick 3-question form…</p>
      <Button size="lg" className="w-full" onClick={() => router.push(href)}>
        Continue to Questionnaire
      </Button>
    </div>
  );
}
