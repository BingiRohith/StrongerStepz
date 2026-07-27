import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Size, Variant } from "@/types/common";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md",
  secondary:
    "bg-transparent text-primary border-2 border-primary hover:bg-secondary-light hover:-translate-y-0.5",
  ghost: "bg-transparent text-ink hover:bg-surface-light",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-6 py-2.5 text-sm",
  md: "px-9 py-4 text-base",
  lg: "px-10 py-[18px] text-lg",
};

/**
 * Renders a `<button>` by default, or an `<a>` when `href` is passed — the
 * legacy site mixes real buttons and anchor-styled-as-button CTAs
 * (e.g. the pricing card's "Join the Workshop" link) that must look
 * identical, so one component covers both.
 */
export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold tracking-wide transition-all duration-300 ease-brand disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (props.href !== undefined) {
    const { href, ...anchorProps } = props;
    return <a href={href} className={classes} {...anchorProps} />;
  }

  const { type = "button", ...buttonProps } = props;
  return <button type={type} className={classes} {...buttonProps} />;
}
