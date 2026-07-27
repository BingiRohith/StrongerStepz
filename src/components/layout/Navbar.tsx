"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  logo?: ReactNode;
  navItems?: NavItem[];
  cta?: ReactNode;
  className?: string;
}

const defaultLogo = (
  <div className="flex flex-col">
    <span className="font-heading text-2xl font-extrabold tracking-wide text-primary">
      STRONGER STEPS
    </span>
    <span className="-mt-1 text-sm font-semibold text-primary">
      Strength · Confidence · Independence
    </span>
  </div>
);

/**
 * Fixed site header — content-agnostic (nav items/CTA are passed in) so it
 * can be reused before the real landing page sections exist. The legacy
 * site hid nav links entirely below 768px with no replacement; this adds a
 * minimal mobile menu so navigation stays reachable at every width.
 */
export function Navbar({ logo = defaultLogo, navItems = [], cta, className }: NavbarProps) {
  const scrolled = useScrollPosition(50);
  const mobileMenu = useDisclosure();

  return (
    <header
      className={cn(
        "fixed top-0 z-[1000] w-full border-b border-black/5 bg-[rgba(252,253,252,0.9)] backdrop-blur-md transition-all duration-300 ease-brand",
        scrolled ? "py-3 shadow-md" : "py-[18px]",
        className
      )}
    >
      <Container className="flex items-center justify-between">
        {logo}

        <nav aria-label="Main navigation" className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[1.05rem] font-semibold text-ink-muted transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
          {cta}
        </nav>

        <button
          type="button"
          onClick={mobileMenu.toggle}
          aria-label={mobileMenu.isOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenu.isOpen}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-0.5 w-6 rounded-full bg-primary transition-transform duration-300 ease-brand",
              mobileMenu.isOpen && "translate-y-2 rotate-45"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "h-0.5 w-6 rounded-full bg-primary transition-opacity duration-300 ease-brand",
              mobileMenu.isOpen && "opacity-0"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "h-0.5 w-6 rounded-full bg-primary transition-transform duration-300 ease-brand",
              mobileMenu.isOpen && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </Container>

      {mobileMenu.isOpen && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col items-center gap-5 border-t border-black/5 bg-[rgba(252,253,252,0.98)] py-6 md:hidden"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={mobileMenu.close}
              className="text-lg font-semibold text-ink-muted transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
          {cta}
        </nav>
      )}
    </header>
  );
}
