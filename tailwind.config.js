/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        unjma: {
          primary: "#1B3D6D",
          secondary: "#E63946",
          light: "#F5F7FA",
          dark: "#0f172a",
          success: "#38A169",
          warning: "#D69E2E",
          danger: "#E53E3E",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      boxShadow: {
        'unjma': '0 4px 20px rgba(27, 61, 109, 0.1)',
        'unjma-lg': '0 10px 40px rgba(27, 61, 109, 0.15)',
      },
    },
  },
  plugins: [],
}