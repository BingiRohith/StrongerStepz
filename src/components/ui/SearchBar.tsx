import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  className?: string;
}

/** Controlled search input — the caller owns `value`/`onChange`; no debouncing baked in. */
export function SearchBar({ className, placeholder = "Search…", ...props }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-muted"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-300 py-3 pr-5 pl-11 text-sm transition-all duration-300 ease-brand focus:border-primary focus:outline-none"
        {...props}
      />
    </div>
  );
}
