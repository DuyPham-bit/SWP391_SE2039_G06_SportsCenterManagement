/** @type {import('tailwindcss').Config} */
// Text: Be Vietnam Pro (full Vietnamese diacritics). Titles and figures: Archivo (`font-display`).
const sans = ['"Be Vietnam Pro"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'];
const display = ['Archivo', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'];

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fpt: {
          blue: '#1A3B8B',
          'blue-light': '#EBF2FC',
          'blue-hover': '#142F70',
          orange: '#F26522',
          green: '#008744'
        }
      },
      fontFamily: { sans, display, lexend: sans, chivo: sans, inter: sans }
    }
  }
};
