/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: '#0a0a0f',
          dark: '#12121a',
          panel: '#1a1a2e',
          border: '#2a2a4a',
          cyan: '#00ffff',
          magenta: '#ff00ff',
          gold: '#ffd700',
          green: '#00ff00',
          red: '#ff3366',
          purple: '#9945ff'
        }
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'arcade': ['"VT323"', 'monospace'],
        'body': ['"Noto Sans"', '"Noto Sans SC"', '"Noto Sans JP"', '"Noto Sans KR"', 'sans-serif']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { 'text-shadow': '0 0 10px currentColor, 0 0 20px currentColor' },
          '100%': { 'text-shadow': '0 0 20px currentColor, 0 0 40px currentColor' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 }
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { 'box-shadow': '0 0 20px currentColor, 0 0 40px currentColor' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff',
        'neon-magenta': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-gold': '0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 20px #ffd700'
      }
    },
  },
  plugins: [],
}
