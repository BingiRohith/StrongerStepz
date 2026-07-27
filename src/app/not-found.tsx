import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-6 py-16">
      <Card className="w-full max-w-md p-10 text-center">
        <p className="mb-2 text-5xl">🔍</p>
        <h1 className="mb-3 font-heading text-2xl text-primary-dark">Page Not Found</h1>
        <p className="mb-8 text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link href="/">
          <Button size="lg" className="w-full">
            Return Home
          </Button>
        </Link>
      </Card>
    </main>
  );
}
