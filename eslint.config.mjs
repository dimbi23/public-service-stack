import nxEslintPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    plugins: { '@nx': nxEslintPlugin },
  },
  // TypeScript files — use the TS parser
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }),
  // Enforce module boundaries across all source files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Apps may only depend on libs, never on other apps
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            // Libs may depend on other shared libs only
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
          ],
        },
      ],
    },
  },
];
