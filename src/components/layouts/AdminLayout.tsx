"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useDisclosure } from "@/hooks/useDisclosure";
import type { WithChildren } from "@/types/common";

export interface AdminNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface AdminLayoutProps extends Partial<WithChildren> {
  navItems: AdminNavItem[];
  activeHref?: string;
  pageTitle: string;
  headerActions?: ReactNode;
}

function NavLinks({
  navItems,
  activeHref,
  onNavigate,
}: {
  navItems: AdminNavItem[];
  activeHref?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            item.href === activeHref && "bg-white/10 text-white"
          )}
        >
          {item.icon}
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/** Sidebar + topbar shell for the admin module. Collapses to a header hamburger menu below `md`. */
export function AdminLayout({ navItems, activeHref, pageTitle, headerActions, children }: AdminLayoutProps) {
  const mobileMenu = useDisclosure();

  return (
    <div className="flex min-h-screen bg-surface-light">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-surface-dark px-5 py-8 text-white md:flex">
        <span className="mb-10 px-3 font-heading text-xl font-extrabold tracking-wide">STRONGER STEPS</span>
        <NavLinks navItems={navItems} activeHref={activeHref} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={mobileMenu.toggle}
              aria-label={mobileMenu.isOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu.isOpen}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 w-5 rounded-full bg-primary-dark transition-transform duration-300 ease-brand",
                  mobileMenu.isOpen && "translate-y-2 rotate-45"
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 w-5 rounded-full bg-primary-dark transition-opacity duration-300 ease-brand",
                  mobileMenu.isOpen && "opacity-0"
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 w-5 rounded-full bg-primary-dark transition-transform duration-300 ease-brand",
                  mobileMenu.isOpen && "-translate-y-2 -rotate-45"
                )}
              />
            </button>
            <h1 className="font-heading text-lg text-primary-dark sm:text-xl">{pageTitle}</h1>
          </div>
          {headerActions}
        </header>

        {mobileMenu.isOpen && (
          <div className="border-b border-black/5 bg-surface-dark px-5 py-4 md:hidden">
            <NavLinks navItems={navItems} activeHref={activeHref} onNavigate={mobileMenu.close} />
          </div>
        )}

        <main className="flex-1 overflow-x-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
