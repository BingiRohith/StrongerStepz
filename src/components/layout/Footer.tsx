import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/utils/cn";

export interface FooterProps {
  children?: ReactNode;
  className?: string;
}

/** Dark footer shell — content-agnostic; the real copy is composed by whatever page renders it. */
export function Footer({ children, className }: FooterProps) {
  return (
    <footer className={cn("bg-surface-dark px-0 py-24 text-white", className)}>
      <Container className="text-center">
        {children ?? (
          <span className="font-heading text-2xl font-extrabold tracking-wider">
            STRONGER STEPS
          </span>
        )}
      </Container>
    </footer>
  );
}
