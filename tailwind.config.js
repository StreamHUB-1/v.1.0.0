/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'), // DaisyUI terpasang di sini
  ],
  daisyui: {
    themes: ["dark"], // Memaksa tema dark bawaan DaisyUI agar selaras dengan StreamHub
  },
};