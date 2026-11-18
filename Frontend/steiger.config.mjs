import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

// Feature-Sliced Design checks (npm run lint:arch). Every rule is on except where noted.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // The project keeps one flat slice per screen (pages/<role>-<name>) so routes map 1:1 to folders.
      'fsd/excessive-slicing': 'off',
      // shared/lib holds small single-purpose helpers; grouping them is cosmetic and touches ~100 imports.
      'fsd/shared-lib-grouping': 'off',
    },
  },
  {
    files: ['./src/entities/**'],
    rules: {
      // Entities mirror the backend domains, so a slice with a single consumer today is still kept.
      'fsd/insignificant-slice': 'off',
      // "staff" is singular and plural at once (uncountable); renaming it would be wrong.
      'fsd/inconsistent-naming': 'off',
    },
  },
]);
