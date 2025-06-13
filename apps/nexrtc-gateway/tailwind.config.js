
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(210, 40%, 50%)',
          hover: 'hsl(210, 40%, 40%)',
          text: 'hsl(0, 0%, 100%)'
        },
        secondary: {
          DEFAULT: 'hsl(180, 50%, 50%)',
          hover: 'hsl(180, 50%, 40%)',
          text: 'hsl(0, 0%, 100%)'
        },
        background: 'hsl(220, 15%, 10%)',
        card: 'hsl(220, 15%, 15%)',
        text: {
          DEFAULT: 'hsl(0, 0%, 95%)',
          muted: 'hsl(0, 0%, 70%)'
        },
        input: 'hsl(220, 15%, 20%)',
        border: 'hsl(220, 15%, 30%)',
        danger: 'hsl(0, 70%, 50%)',
      }
    },
  },
  plugins: [],
};
