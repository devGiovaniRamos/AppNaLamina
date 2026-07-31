/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        gold: {
          50: '#fbf4e4',
          100: '#f5e7c4',
          200: '#eccf8f',
          300: '#e2b95f',
          400: '#d6a748',
          500: '#c9963c',
          600: '#ab7c2e',
          700: '#8a6225',
          800: '#6b4b1d',
          900: '#523816',
        },
      },
    },
  },
  plugins: [],
}
