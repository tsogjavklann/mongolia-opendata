import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-border/30 via-border/50 to-border/30 bg-[length:400px_100%]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
