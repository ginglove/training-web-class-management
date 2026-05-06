import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-200 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger:  "bg-red-100 text-red-700",
    info:    "bg-sky-100 text-sky-700",
    outline: "border border-slate-200 bg-transparent text-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
