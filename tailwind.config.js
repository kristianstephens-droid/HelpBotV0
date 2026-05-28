/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // VT Help Bot palette extracted from the brand assets.
        vt: {
          ink: "#0f1d3d",     // headings + wordmark
          muted: "#5b6478",   // subtitles
          border: "#a7c2ef",  // pill button border
          accent: "#3b6bd6",  // chevrons + hover accents
          tint: "#eef3ff",    // soft button hover bg
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
