/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F1210",
        paper: "#F7F5EF",
        card: "#FDFBF6",
        border: "#E8E3D6",
        gold: "#C9A876",
        sage: "#4A6355",
        clay: "#B85C4A",
        muted: "#8A8272",
        faint: "#A39C8A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
