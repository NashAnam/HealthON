/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f9fafb",   // light background
        foreground: "#111827",   // dark text
        border: "#e5e7eb",       // for borders
        primary: "#4f46e5",      // example primary color
      },
      fontFamily: {
        geistSans: ["Inter", "sans-serif"],
        geistMono: ["Roboto Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
