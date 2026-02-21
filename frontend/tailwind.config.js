/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#ea580c",
        secondary: "#64748b",
      },
    },
  },
  plugins: [],
}
