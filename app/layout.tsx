import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Монголын Нээлттэй Өгөгдлийн SQL — 1212.mn',
  description:
    'SQL-тэй төстэй синтаксаар 1212.mn нээлттэй өгөгдлийг асуулга хий. Шуурхай график, хүснэгт.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              classNames: {
                toast:
                  'group toast bg-popover text-popover-foreground border border-border shadow-floating rounded-xl',
                title: 'font-display font-semibold text-sm',
                description: 'text-xs text-muted-foreground',
                actionButton: 'bg-accent text-primary-foreground rounded-md text-xs px-2 py-1',
                cancelButton: 'bg-muted text-muted-foreground rounded-md text-xs px-2 py-1',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
