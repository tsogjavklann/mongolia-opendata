import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-accent-dim text-accent',
        secondary:
          'border-transparent bg-surface-raised text-ink-300',
        destructive:
          'border-transparent bg-destructive/10 text-destructive',
        outline: 'border-border text-ink-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
