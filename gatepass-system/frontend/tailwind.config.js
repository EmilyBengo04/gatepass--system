/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0B1220",
          900: "#0F1B2D",
          800: "#152238",
        },
        brand: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          500: "#2E5AAC",
          600: "#204685",
          700: "#17325F",
        },
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          300: "#CBD5E1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
};
