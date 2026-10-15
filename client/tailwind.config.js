/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#0d0906',
          900: '#16100b',
          850: '#1e1610',
          800: '#2c1d13',
          750: '#3b2618',
          700: '#4d3220',
          600: '#6b4429',
          500: '#9a6641',
          400: '#c49070',
          300: '#ddb898',
          200: '#eeddc9',
          100: '#f9efe4',
          accent: '#d4904e', bronze: '#c97c35', copper: '#e8924c',
          cognac: '#b56528', gold: '#f0b865', emerald: '#10b981',
          rose: '#f43f5e', amber: '#d4904e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-amber':   '0 0 30px -5px rgba(212, 144, 78, 0.55)',
        'glow-bronze':  '0 0 30px -5px rgba(201, 124, 53, 0.55)',
        'glow-copper':  '0 0 30px -5px rgba(232, 146, 76, 0.55)',
        'glow-cyan':    '0 0 25px -5px rgba(212, 144, 78, 0.45)',
        'glow-violet':  '0 0 25px -5px rgba(201, 124, 53, 0.45)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-rose':    '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'inner-glow':   'inset 0 0 25px 0 rgba(212, 144, 78, 0.12)',
        'card':         '0 20px 60px -15px rgba(0,0,0,0.65)',
        'btn':          '0 8px 25px -5px rgba(212, 144, 78, 0.5)',
      },
      keyframes: {
        'pulse-glow': { '0%,100%': {opacity:'0.6',transform:'scale(1)'}, '50%': {opacity:'1',transform:'scale(1.04)'} },
        'scanline':   { '0%': {transform:'translateY(-100%)'}, '100%': {transform:'translateY(1200%)'} },
        'radar-ping': { '0%': {transform:'scale(0.8)',opacity:'0.9'}, '100%': {transform:'scale(2.5)',opacity:'0'} },
        'shimmer':    { '0%': {backgroundPosition:'-200% 0'}, '100%': {backgroundPosition:'200% 0'} },
        'rotate-slow':{ '0%': {transform:'rotate(0deg)'}, '100%': {transform:'rotate(360deg)'} },
        'float':      { '0%,100%': {transform:'translateY(0px)'}, '50%': {transform:'translateY(-8px)'} },
        'fade-in':    { '0%': {opacity:'0',transform:'translateY(10px)'}, '100%': {opacity:'1',transform:'translateY(0)'} },
        'glow-pulse': { '0%,100%': {boxShadow:'0 0 20px rgba(212,144,78,0.25)'}, '50%': {boxShadow:'0 0 45px rgba(212,144,78,0.6)'} },
        'border-flow':{ '0%,100%': {borderColor:'rgba(212,144,78,0.3)'}, '50%': {borderColor:'rgba(245,192,112,0.75)'} },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'scanline':   'scanline 3s linear infinite',
        'radar':      'radar-ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'shimmer':    'shimmer 3s infinite linear',
        'spin-slow':  'rotate-slow 20s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'fade-in':    'fade-in 0.4s ease-out forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'border-flow':'border-flow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
