/** @type {import('tailwindcss').Config} */
// Text: Be Vietnam Pro (full Vietnamese diacritics). Titles and figures: Archivo (`font-display`).
const sans = ['"Be Vietnam Pro"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'];
const display = ['Archivo', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'];

// Colours are CSS variables defined in src/app/styles/tokens.css (RGB channels, so `/opacity` modifiers work).
const token = name => `rgb(var(--${name}) / <alpha-value>)`;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const scale = name => Object.fromEntries(STEPS.map(step => [step, token(`brand-${name}-${step}`)]));

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Tailwind 3 has no 4.5/18 steps; components use p-4.5, h-18, w-18.
      spacing: { 4.5: '1.125rem', 18: '4.5rem' },
      colors: {
        // Brand scales derived from the landing palette (navy, sage, sand/cream, terracotta, teal) + danger.
        brand: {
          navy: scale('navy'),
          sage: scale('sage'),
          sand: scale('sand'),
          terra: scale('terra'),
          teal: scale('teal'),
          danger: scale('danger')
        },
        // Semantic tokens: switch automatically between light and dark mode.
        primary: { DEFAULT: token('color-primary'), hover: token('color-primary-hover'), soft: token('color-primary-soft') },
        secondary: { DEFAULT: token('color-secondary'), hover: token('color-secondary-hover') },
        accent: { DEFAULT: token('color-accent'), hover: token('color-accent-hover') },
        on: { primary: token('color-on-primary'), secondary: token('color-on-secondary'), accent: token('color-on-accent') },
        surface: { DEFAULT: token('color-surface'), muted: token('color-surface-muted'), raised: token('color-surface-raised'), cream: token('color-surface-cream') },
        line: { DEFAULT: token('color-border'), strong: token('color-border-strong') },
        ink: { DEFAULT: token('color-text'), strong: token('color-text-strong'), muted: token('color-text-muted') },
        success: { DEFAULT: token('color-success'), soft: token('color-success-soft') },
        warning: { DEFAULT: token('color-warning'), soft: token('color-warning-soft') },
        danger: { DEFAULT: token('color-danger'), soft: token('color-danger-soft') },
        info: { DEFAULT: token('color-info'), soft: token('color-info-soft') },
        focus: token('color-focus'),
        chart: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => [i, token(`color-chart-${i}`)])),
        /** @deprecated FPT portal colours — now aliases of the brand tokens; use primary/accent/success instead. */
        fpt: {
          blue: token('color-primary'),
          'blue-light': token('color-primary-soft'),
          'blue-hover': token('color-primary-hover'),
          orange: token('color-accent-hover'),
          green: token('color-success')
        }
      },
      fontFamily: { sans, display, lexend: sans, chivo: sans, inter: sans }
    }
  }
};
