/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Brand red is kept but demoted to an accent: primary buttons, the active-nav rail,
         * unread dots and critical badges. Never a heading, never a body colour.
         */
        brand: {
          50: '#FEF2F2',
          100: '#FDE4E5',
          200: '#F9C3C5',
          300: '#F09598',
          400: '#E15E63',
          500: '#CE181E',
          600: '#B31418',
          700: '#8F1114',
        },
        ink: {
          DEFAULT: '#14161A',
          secondary: '#3D444F',
          muted: '#5B6472',
          subtle: '#8A93A1',
        },
        line: {
          DEFAULT: '#EEF0F3',
          strong: '#DDE1E7',
        },
        canvas: '#F6F7F9',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FAFBFC',
        },
        positive: { 50: '#ECFDF5', 500: '#0E9F6E', 700: '#047857' },
        caution: { 50: '#FFFBEB', 500: '#D97706', 700: '#B45309' },
        info: { 50: '#EFF6FF', 500: '#2563EB', 700: '#1D4ED8' },
      },
      fontFamily: {
        // Montserrat carries the brand voice on page titles; Inter does the interface work.
        display: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['11px', { lineHeight: '16px', letterSpacing: '0.04em' }],
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        md: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        metric: ['32px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        control: '10px',
        card: '14px',
        panel: '18px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 22, 26, 0.04), 0 1px 1px rgba(20, 22, 26, 0.03)',
        lift: '0 8px 24px -12px rgba(20, 22, 26, 0.20), 0 2px 6px -2px rgba(20, 22, 26, 0.06)',
        overlay: '0 24px 60px -20px rgba(20, 22, 26, 0.35)',
        rail: 'inset 3px 0 0 0 #CE181E',
      },
      spacing: {
        rail: '4.5rem',
        sidebar: '16.5rem',
        topbar: '3.75rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'rise-in': 'rise-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in': 'slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
