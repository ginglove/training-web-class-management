import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "neu-input w-full text-foreground placeholder:text-slate-400 focus:ring-1 focus:ring-primary/50",
            error && "ring-1 ring-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger pl-1 font-medium">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
