"use client";

import { useEffect, type RefObject } from "react";

/** Invokes `onOutsideClick` when a pointer event lands outside `ref`. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutsideClick: () => void,
  active = true
): void {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ref, onOutsideClick, active]);
}
