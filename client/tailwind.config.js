/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0f14',
        surface: '#141720',
        border: '#1e2330',
        muted: '#3a4055',
        text: '#e2e8f0',
        subtle: '#8892a4',
        buy: '#22c55e',
        sell: '#ef4444',
        wait: '#f59e0b',
        gold: '#d4af37',
      },
    },
  },
  plugins: [],
}
