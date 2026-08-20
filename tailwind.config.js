/** @type {import('tailwindcss').Config} */

// All colors are semantic roles backed by CSS variables (see index.css).
// Themes swap the variables under [data-theme="..."]; class names never change.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        // Surfaces
        surface: token("surface"),
        raised: token("raised"),
        bar: token("bar"),
        divider: token("divider"),
        // Text
        ink: token("ink"),
        bright: token("bright"),
        muted: token("muted"),
        faint: token("faint"),
        // Accent + hues
        accent: token("accent"),
        red: token("red"),
        orange: token("orange"),
        yellow: token("yellow"),
        green: token("green"),
        magenta: token("magenta"),
        blue: token("blue"),
        cyan: token("cyan"),
        teal: token("teal"),
      },
    },
  },
  plugins: [],
};
