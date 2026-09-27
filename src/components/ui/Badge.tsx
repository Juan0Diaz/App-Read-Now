import * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  primary: 'border border-primary/20 bg-primary/10 text-primary',
  secondary: 'border border-border bg-surface-soft text-text-body',
  accent: 'border border-accent/30 bg-accent/10 text-accent',
  success: 'border border-success/30 bg-success-soft text-success',
  warning: 'border border-warning/30 bg-warning-soft text-warning',
  error: 'border border-error/30 bg-error-soft text-error',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'secondary', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export const Tag = Badge;
