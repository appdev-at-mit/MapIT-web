/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/src/**/*.{js,jsx,ts,tsx}", "./client/index.html"],
  theme: {
    extend: {
      colors: {
        'appdev-teal': '#96C2C5',
        'appdev-blue': '#7DAACA',
        'appdev-green': '#A3BFA2',
        'appdev-purple': '#B796D9',
      },
    },
  },
  plugins: [],
};

