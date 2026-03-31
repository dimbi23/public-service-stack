import nxEslintPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/out-tsc/**',
      '**/test-output/**',
      '**/coverage/**',
      '**/prisma.config.ts',
    ],
  },
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
            // E2E projects may only depend on libs
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            // Libs may depend on other shared libs only
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            // Shared libs stay within shared scope
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Domain scopes may only use shared + same domain
            {
              sourceTag: 'scope:case',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:case'],
            },
            {
              sourceTag: 'scope:procedures',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:procedures'],
            },
            {
              sourceTag: 'scope:wbb',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:wbb'],
            },
            {
              sourceTag: 'scope:portal',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:portal'],
            },
            {
              sourceTag: 'scope:testing',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:testing'],
            },
          ],
        },
      ],
    },
  },
];
