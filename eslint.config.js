const eslint = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    // Global ignores (replaces .eslintignore)
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.d.ts',
      '*.config.js',
      '*.config.ts',
      '.github/**',
      'k8s/**',
      'docs/**',
    ],
  },
  {
    // Configuration for JavaScript files (no TypeScript parser)
    ...eslint.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        node: true,
        es2022: true,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Disable conflicting rules with Prettier
      ...prettierConfig.rules,

      // Import/export sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Prettier integration
      'prettier/prettier': 'error',

      // Console statements for config files
      'no-console': 'off',
    },
  },
  {
    // Configuration for TypeScript files
    ...eslint.configs.recommended,
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        node: true,
        es2022: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'simple-import-sort': simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Disable conflicting rules with Prettier
      ...prettierConfig.rules,

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Prettier integration
      'prettier/prettier': 'error',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // Specific rules for test files
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Specific rules for configuration files
    files: ['**/*.config.{js,ts,mjs,cjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
