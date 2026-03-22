import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canton: {
          primary: "#0066FF",
          secondary: "#00D4FF",
          dark: "#0A0E27",
          gray: "#1A1F3A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
