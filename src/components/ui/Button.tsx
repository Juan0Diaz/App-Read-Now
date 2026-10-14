import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        accent: "bg-accent text-white hover:bg-accent-hover",
        secondary: "bg-surface-soft text-text-strong border border-border hover:bg-surface-muted",
        destructive: "bg-error text-white hover:bg-red-700",
        outline: "border border-border bg-surface text-text-strong hover:bg-surface-soft",
        ghost: "text-text-body hover:bg-surface-soft hover:text-text-strong",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-10 px-3 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  shimmer?: boolean;
}

const shimmerColors: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  secondary: "var(--color-surface-soft)",
  destructive: "var(--color-error)",
  outline: "var(--color-surface)",
  ghost: "var(--color-surface-soft)",
  link: "var(--color-primary)",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shimmer = false, style, children, ...props }, ref) => {
    const buttonStyle = shimmer
      ? { ...style, "--button-shimmer-color": shimmerColors[variant ?? "primary"] } as React.CSSProperties
      : style;
    const buttonChildren = shimmer
      ? React.Children.map(children, (child, index) =>
          child === null || typeof child === "boolean" ? child : (
            <span key={index} className="relative z-10 inline-flex items-center">
              {child}
            </span>
          )
        )
      : children;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), shimmer && "button-shimmer")}
        ref={ref}
        style={buttonStyle}
        {...props}
      >
        {buttonChildren}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
