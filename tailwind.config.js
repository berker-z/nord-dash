/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        nord: {
          0: "#2E3440", // Polar Night (Darkest)
          1: "#3B4252",
          2: "#434C5E",
          3: "#4C566A", // Polar Night (Lightest)
          4: "#D8DEE9", // Snow Storm (Darkest)
          5: "#E5E9F0",
          6: "#ECEFF4", // Snow Storm (Lightest)
          7: "#8FBCBB", // Frost (Teal)
          8: "#88C0D0", // Frost (Cyan)
          9: "#81A1C1", // Frost (Blue)
          10: "#5E81AC", // Frost (Dark Blue)
          11: "#BF616A", // Aurora (Red)
          12: "#D08770", // Aurora (Orange)
          13: "#EBCB8B", // Aurora (Yellow)
          14: "#A3BE8C", // Aurora (Green)
          15: "#B48EAD", // Aurora (Purple)
          16: "#1E2A3A", // Custom Dark Indigo (for accents)
        },
      },
    },
  },
  plugins: [],
};
