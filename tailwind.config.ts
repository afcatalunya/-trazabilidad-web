import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Aluminios Franco brand colors
        sidebar: '#1a5c35',          // deep forest green
        'af-green': {
          50:  '#f0faf4',
          100: '#d9f2e3',
          200: '#b3e4c8',
          300: '#7fce9e',
          400: '#4db375',
          500: '#2d9e4e',            // primary AF green
          600: '#217a3b',
          700: '#1a5c35',            // sidebar / dark
          800: '#144528',
          900: '#0e301c',
        },
      },
    },
  },
  plugins: [],
}
export default config
