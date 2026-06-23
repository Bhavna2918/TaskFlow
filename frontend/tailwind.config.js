/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        darkBg: '#0b1329',      // Premium Space/Navy background
        darkCard: '#1c2541',    // Glass card background (with opacity)
        accentNeon: '#6366f1',  // Neon Purple/Indigo primary
        accentCyan: '#06b6d4',  // Teal/Cyan secondary
        accentPink: '#ec4899',  // Accent highlight
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(28, 37, 65, 0.45) 0%, rgba(11, 19, 41, 0.6) 100%)',
        'glass-glow': 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.15), transparent 40%)',
        'neon-gradient': 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'neon-glow': '0 0 15px rgba(99, 102, 241, 0.4)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
        'neon-pink': '0 0 15px rgba(236, 72, 153, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
