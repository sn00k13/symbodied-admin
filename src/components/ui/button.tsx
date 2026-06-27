import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-deep border-transparent",
  secondary: "bg-transparent text-brand border-brand hover:bg-brand-light dark:hover:bg-[#112618] active:bg-brand-light",
  gold: "bg-gold text-ink border-gold hover:bg-gold-mid active:bg-gold-dark",
  ghost: "bg-transparent text-ink-600 dark:text-[#89a895] border-transparent hover:bg-ink-100 dark:hover:bg-[#1b2d20] hover:text-ink dark:hover:text-[#dceee3]",
  danger: "bg-error text-white border-transparent hover:bg-red-700",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth = false, leadingIcon, trailingIcon, loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border font-sans font-semibold",
          "transition-all duration-200 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-hover focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
