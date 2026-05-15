/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // ── Brand (constant across themes) ─────────────
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },

        // ── Surface (theme-aware via CSS variables) ────
        surface: {
          DEFAULT: 'var(--c-surface)',
          dark: 'var(--c-surface-dark)',
          darker: 'var(--c-surface-darker)',
          raised: 'var(--c-surface-raised)',
          overlay: 'var(--c-surface-overlay)',
        },
        ink: {
          50: 'var(--c-ink-50)',
          100: 'var(--c-ink-100)',
          200: 'var(--c-ink-200)',
          300: 'var(--c-ink-300)',
          400: 'var(--c-ink-400)',
          500: 'var(--c-ink-500)',
          600: 'var(--c-ink-600)',
          700: 'var(--c-ink-700)',
          800: 'var(--c-ink-800)',
          900: 'var(--c-ink-900)',
          950: 'var(--c-ink-950)',
        },
        border: {
          DEFAULT: 'var(--c-border)',
          light: 'var(--c-border-light)',
          subtle: 'var(--c-border-subtle)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          hover: 'var(--c-accent-hover)',
          dim: 'var(--c-accent-dim)',
          glow: 'var(--c-accent-glow)',
        },
        accent2: {
          DEFAULT: 'var(--c-accent2)',
          dim: 'var(--c-accent2-dim)',
          glow: 'var(--c-accent2-glow)',
        },
        accent3: {
          DEFAULT: 'var(--c-accent3)',
          dim: 'var(--c-accent3-dim)',
        },
        danger: {
          DEFAULT: 'var(--c-danger)',
          dim: 'var(--c-danger-dim)',
        },

        // ── shadcn / Radix tokens (theme-aware) ────────
        background: 'var(--c-background)',
        foreground: 'var(--c-foreground)',
        card: {
          DEFAULT: 'var(--c-card)',
          foreground: 'var(--c-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--c-popover)',
          foreground: 'var(--c-popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--c-primary)',
          foreground: 'var(--c-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--c-secondary)',
          foreground: 'var(--c-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--c-muted)',
          foreground: 'var(--c-muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--c-destructive)',
          foreground: 'var(--c-destructive-foreground)',
        },
        input: 'var(--c-input)',
        ring: 'var(--c-ring)',
      },
      spacing: {
        sidebar: '280px',
        18: '4.5rem',
      },
      borderRadius: {
        card: '14px',
        xl: '14px',
        '2xl': '18px',
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      fontSize: {
        code: ['12.5px', { lineHeight: '1.75' }],
        label: ['10.5px', { lineHeight: '1.5', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0,214,143,0.18), 0 0 60px rgba(0,214,143,0.06)',
        'glow-blue': '0 0 20px rgba(91,156,246,0.18), 0 0 60px rgba(91,156,246,0.06)',
        elevated: '0 4px 24px var(--c-shadow), 0 0 0 1px var(--c-border)',
        floating: '0 16px 48px var(--c-shadow-strong), 0 0 0 1px var(--c-border)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
