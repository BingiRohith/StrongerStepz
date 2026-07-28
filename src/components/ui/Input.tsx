import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="text-left">
        {label && (
          <label htmlFor={inputId} className="mb-2 block font-semibold text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-gray-300 px-5 py-3.5 font-body text-base transition-all duration-300 ease-brand focus:border-primary focus:shadow-[0_0_0_3px_rgba(43,92,77,0.1)] focus:outline-none",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        ) : (
          helperText && (
            <p id={helperId} className="mt-1.5 text-sm text-ink-muted">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
