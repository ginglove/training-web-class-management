import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, rightElement, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            type={type}
            className={cn(
              "neu-input w-full text-foreground placeholder:text-slate-400 focus:ring-1 focus:ring-primary/50 pr-12",
              error && "ring-1 ring-danger",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-danger pl-1 font-medium">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
