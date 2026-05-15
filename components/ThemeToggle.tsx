'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <button
      type="button"
      aria-label="Theme toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-surface-raised hover:text-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
