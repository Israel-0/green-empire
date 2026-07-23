/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'grow-dark': '#0a0e0a',
        'grow-darker': '#060a06',
        'grow-panel': '#111911',
        'grow-border': '#1a2e1a',
        'grow-green': '#4ade80',
        'grow-green-bright': '#86efac',
        'grow-purple': '#a855f7',
        'grow-gold': '#fbbf24',
        'grow-red': '#ef4444',
        'grow-blue': '#38bdf8',
        'grow-amber': '#f59e0b',
        'grow-white': '#e2e8f0',
        'grow-muted': '#64748b',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'grow': '0 0 20px rgba(74, 222, 128, 0.1)',
        'grow-lg': '0 0 40px rgba(74, 222, 128, 0.15)',
        'gold': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
      animation: {
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 4s linear infinite',
        'glow-legendary': 'glowLegendary 1.5s ease-in-out infinite alternate',
        'glow-yerbon': 'glowYerbon 1s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(74, 222, 128, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { filter: 'brightness(1)' },
          '100%': { filter: 'brightness(1.3)' },
        },
        glowLegendary: {
          '0%': { boxShadow: '0 0 15px rgba(244, 114, 182, 0.4), 0 0 30px rgba(244, 114, 182, 0.1)', filter: 'brightness(1)' },
          '100%': { boxShadow: '0 0 30px rgba(244, 114, 182, 0.8), 0 0 60px rgba(244, 114, 182, 0.3)', filter: 'brightness(1.15)' },
        },
        glowYerbon: {
          '0%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.2)', filter: 'brightness(1)' },
          '50%': { boxShadow: '0 0 40px rgba(251, 191, 36, 0.9), 0 0 80px rgba(251, 191, 36, 0.4)', filter: 'brightness(1.2)' },
          '100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.2)', filter: 'brightness(1)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'animate-glow-legendary',
    'animate-glow-yerbon',
  ],
};
