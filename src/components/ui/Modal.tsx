"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import type { WithChildren } from "@/types/common";

export interface ModalProps extends Partial<WithChildren> {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  glass?: boolean;
}

/** Generic overlay + centered panel. `Dialog` builds structured title/description/footer content on top of this. */
export function Modal({ isOpen, onClose, className, glass = true, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useOutsideClick(contentRef, onClose, isOpen);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        ref={contentRef}
        className={cn(
          "relative flex max-h-[90vh] w-[90%] max-w-lg flex-col rounded-3xl shadow-lg",
          glass ? "border border-white/50 bg-white/70 backdrop-blur-md" : "bg-white",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-6 z-10 text-3xl leading-none text-ink-muted transition-colors hover:text-ink"
        >
          &times;
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-8 md:p-12">{children}</div>
      </div>
    </div>,
    document.body
  );
}
