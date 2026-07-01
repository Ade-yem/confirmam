import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#0F8F5F',
          dark: '#0B7249',
          50: '#E8F6EF',
          100: '#CDEEDE',
        },
        midnight: {
          DEFAULT: '#111827',
          60: '#4B5563',
          40: '#9CA3AF',
        },
        lime: '#7CFF6B',
        surface: '#FAFAF8',
        card: '#FFFFFF',
        coral: '#EF4444',
        amber: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-sm': ['48px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'title': ['16px', { lineHeight: '1.3', fontWeight: '700' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '24px',
        '2xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(17, 24, 39, 0.06)',
        card: '0 2px 8px rgba(17, 24, 39, 0.04)',
        cta: '0 8px 20px rgba(15, 143, 95, 0.40)',
        // Neumorphic Soft UI Shadow Tokens
        'neu-flat': '5px 5px 10px #eaeaea, -5px -5px 10px #ffffff',
        'neu-pressed': 'inset 4px 4px 8px #eaeaea, inset -4px -4px 8px #ffffff',
        'neu-flat-emerald': '5px 5px 10px #d6ebe0, -5px -5px 10px #ffffff',
        'neu-pressed-emerald': 'inset 4px 4px 8px #c5e3d2, inset -4px -4px 8px #ffffff',
        'neu-flat-dark': '5px 5px 10px #090d15, -5px -5px 10px #192339',
        'neu-pressed-dark': 'inset 4px 4px 8px #090d15, inset -4px -4px 8px #192339',
      },
      screens: {
        md: '768px',
        lg: '1200px',
      },
    },
  },
  plugins: [],
} satisfies Config
