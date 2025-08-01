/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'bubble-appear': 'bubbleAppear 0.3s ease-out',
        'dot-pulse': 'dotPulse 1.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bubbleAppear: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(-50%) translateY(10px) scale(0.8)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(-50%) translateY(0) scale(1)' 
          },
        },
        dotPulse: {
          '0%, 60%, 100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
          '30%': { 
            transform: 'scale(0.8)', 
            opacity: '0.5' 
          },
        },
      },
    },
  },
  plugins: [],
}
