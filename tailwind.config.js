/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Luvina brand — sampled from luvina.net (#ce181e is the dominant accent).
        brand: {
          50: '#fdf2f2',
          100: '#fbe3e4',
          200: '#f5c3c5',
          300: '#ec9598',
          400: '#e05f64',
          500: '#ce181e',
          600: '#b20000',
          700: '#940003',
          800: '#7a0507',
          900: '#640b0d',
        },
        ink: {
          DEFAULT: '#1c1d1f',
          soft: '#313131',
          muted: '#4a4b4c',
          faint: '#6d6e71',
        },
        line: {
          DEFAULT: '#e2e2e4',
          strong: '#c9cacc',
        },
        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f4f4f5',
          raised: '#fbfbfb',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Roboto', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        label: '0.14em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,29,31,0.06), 0 8px 24px -16px rgba(28,29,31,0.24)',
        pop: '0 12px 40px -12px rgba(28,29,31,0.32)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 180ms ease-out',
        'fade-in': 'fade-in 140ms ease-out',
      },
    },
  },
  plugins: [],
}
