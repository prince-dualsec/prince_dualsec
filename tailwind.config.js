/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Small phones (iPhone SE is 375px) need a step below Tailwind's 640px sm.
        xs: '400px',
        // The width at which the whole navbar row — eleven section links plus
        // the Connect, theme and CV controls — fits without clipping. Below it
        // the links belong in the burger menu. Measured, not guessed: the row
        // needs ~1410px of content box.
        nav: '1500px',
      },
      colors: {
        cyber: {
          black: 'rgb(var(--cyber-black) / <alpha-value>)',
          navy: 'rgb(var(--cyber-navy) / <alpha-value>)',
          dark: 'rgb(var(--cyber-dark) / <alpha-value>)',
          card: 'rgb(var(--cyber-card) / <alpha-value>)',
          border: 'rgb(var(--cyber-border) / <alpha-value>)',
          cyan: 'rgb(var(--cyber-cyan) / <alpha-value>)',
          blue: 'rgb(var(--cyber-blue) / <alpha-value>)',
          purple: 'rgb(var(--cyber-purple) / <alpha-value>)',
          green: 'rgb(var(--cyber-green) / <alpha-value>)',
          red: 'rgb(var(--cyber-red) / <alpha-value>)',
          orange: 'rgb(var(--cyber-orange) / <alpha-value>)',
          text: 'rgb(var(--cyber-text) / <alpha-value>)',
          muted: 'rgb(var(--cyber-muted) / <alpha-value>)',
          white: 'rgb(var(--cyber-white) / <alpha-value>)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'typing': 'typing 3.5s steps(40, end)',
        'blink': 'blink 1s step-end infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2), 0 0 20px rgba(0, 212, 255, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        blink: {
          'from, to': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
