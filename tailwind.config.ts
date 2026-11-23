import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf6ee',
          100: '#faebd7',
          200: '#f4d4a7',
          300: '#ecb96f',
          400: '#e39844',
          500: '#dc7e28',
          600: '#ce641e',
          700: '#a94c1a',
          800: '#883e1c',
          900: '#6f351a',
          950: '#3c1a0b',
        },
        academy: {
          dark:  '#1a1f2e',
          navy:  '#243354',
          blue:  '#2d4a7a',
          gold:  '#c8963c',
          warm:  '#f5f0e8',
          cream: '#faf7f2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
