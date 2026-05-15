import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-border bg-surface-darker/70 px-3 py-2 text-sm font-sans text-foreground transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-500 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-dim disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
