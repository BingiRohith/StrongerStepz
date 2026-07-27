import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="text-left">
        {label && (
          <label htmlFor={selectId} className="mb-2 block font-semibold text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5 font-body text-base transition-all duration-300 ease-brand focus:border-primary focus:shadow-[0_0_0_3px_rgba(43,92,77,0.1)] focus:outline-none",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
