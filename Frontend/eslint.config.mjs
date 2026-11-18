import boundaries from 'eslint-plugin-boundaries';

// Architecture lint only (npm run lint:arch): imports must point down the FSD layers
// app → pages → widgets → features → entities → shared. Cross-slice imports inside a layer are
// checked by steiger (fsd/forbidden-imports), so same-layer imports are allowed here.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Inline directives in the code target the app's regular lint rules, which this config does not load.
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'off' },
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/main.jsx', mode: 'file' },
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': [2, {
        default: 'disallow',
        policies: LAYERS.map((layer, index) => ({
          from: { element: { type: layer } },
          allow: { to: { element: { types: LAYERS.slice(index) } } },
        })),
      }],
    },
  },
];
