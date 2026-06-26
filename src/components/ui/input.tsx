import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leadingIcon, trailingIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink font-sans">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="absolute left-3 text-ink-500 flex items-center">{leadingIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-lg border font-sans text-sm text-ink bg-white",
              "border-ink-200 placeholder:text-ink-400",
              "transition-all duration-200",
              "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
              error && "border-error focus:border-error focus:ring-error/20",
              leadingIcon ? "pl-10" : "pl-4",
              trailingIcon ? "pr-10" : "pr-4",
              className
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-3 text-ink-500 flex items-center">{trailingIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-error font-sans">{error}</p>}
        {helper && !error && <p className="text-xs text-ink-500 font-sans">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
