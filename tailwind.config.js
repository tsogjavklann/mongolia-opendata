/** @type {import('tailwindcss').Config} */
module.exports = {
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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Layered surface system (3 depth levels)
        surface: {
          DEFAULT: '#0c1322',
          dark: '#070c18',
          darker: '#050a14',
          raised: '#101b2e',
          overlay: '#142038',
        },
        border: {
          DEFAULT: '#1a2d4a',
          light: '#1e3a5f',
          subtle: '#132240',
        },
        accent: {
          DEFAULT: '#00d68f',
          hover: '#00e8a0',
          dim: 'rgba(0,214,143,0.08)',
          glow: 'rgba(0,214,143,0.15)',
        },
        accent2: {
          DEFAULT: '#5b9cf6',
          dim: 'rgba(91,156,246,0.08)',
          glow: 'rgba(91,156,246,0.15)',
        },
        accent3: {
          DEFAULT: '#f0b040',
          dim: 'rgba(240,176,64,0.08)',
        },
        danger: {
          DEFAULT: '#f05252',
          dim: 'rgba(240,82,82,0.08)',
        },
      },
      spacing: {
        sidebar: '280px',
        18: '4.5rem',
      },
      borderRadius: {
        card: '14px',
        xl: '14px',
        '2xl': '18px',
      },
      fontSize: {
        code: ['12.5px', { lineHeight: '1.75' }],
        label: ['10.5px', { lineHeight: '1.5', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0,214,143,0.12), 0 0 60px rgba(0,214,143,0.05)',
        'glow-blue': '0 0 20px rgba(91,156,246,0.12), 0 0 60px rgba(91,156,246,0.05)',
        'elevated': '0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(26,45,74,0.5)',
        'floating': '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(26,45,74,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
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
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
