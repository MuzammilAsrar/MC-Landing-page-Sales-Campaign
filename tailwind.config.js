/** Mirrors the inline `tailwind.config` the CDN used to read.
 *  Kept at the repo root so `npx tailwindcss` finds it with no flags. */
module.exports = {
  content: ["./index.html", "./checkout.html", "./components/*.html"],
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: "#0A0A0B", soft: "#131316", line: "#26262B" },
        bone:  { DEFAULT: "#F7F5F2", warm: "#EFEAE3" },
        beige: "#DFD5C7",
        gold:  { DEFAULT: "#C9A45C", light: "#E4CE9A", deep: "#9A7B3F" },
      },
      fontFamily: {
        sans:     ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display:  ["Fraunces", "ui-serif", "Georgia", "serif"],
        garamond: ["EB Garamond", "ui-serif", "Georgia", "serif"],
      },
    },
  },
};
