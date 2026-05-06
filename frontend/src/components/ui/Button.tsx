import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, children, ...props }, ref) => {
    
    const baseClass = "relative inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none rounded-xl";
    
    const variants = {
      primary: "neu-btn text-primary hover:text-primary-dark active:neu-pressed",
      secondary: "neu-btn text-foreground hover:text-slate-600 active:neu-pressed",
      danger: "neu-btn text-danger hover:text-red-700 active:neu-pressed",
      ghost: "hover:bg-black/5 text-foreground",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm rounded-lg",
      lg: "h-12 px-8 rounded-xl",
      icon: "h-10 w-10",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseClass, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props as HTMLMotionProps<"button">}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"
