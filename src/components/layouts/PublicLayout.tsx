import type { ReactNode } from "react";
import { Navbar, type NavbarProps } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { WithChildren } from "@/types/common";

export interface PublicLayoutProps extends Partial<WithChildren> {
  navbarProps?: NavbarProps;
  footer?: ReactNode;
  /** Rendered after the Footer — e.g. the legacy site's live-stats bar. */
  afterFooter?: ReactNode;
}

/** Page shell for the public marketing site: fixed Navbar, main content, Footer, optional trailing slot. */
export function PublicLayout({ navbarProps, footer, afterFooter, children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar {...navbarProps} />
      <main className="flex-1 pt-[90px]">{children}</main>
      <Footer>{footer}</Footer>
      {afterFooter}
    </div>
  );
}
