// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = /** @type {import('eslint').ESLint.Plugin} */ (
  require('eslint-plugin-boundaries')
);
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    plugins: { boundaries },
    processor: angular.processInlineTemplates,
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.json'] } },
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/app/domain/**' },
        { type: 'data', pattern: 'src/app/data/**' },
        { type: 'application', pattern: 'src/app/application/**' },
        { type: 'feature', pattern: 'src/app/features/**' },
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'core', pattern: 'src/app/core/**' },
        { type: 'theme', pattern: 'src/app/theme/**' },
      ],
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              allow: { to: { element: { type: 'domain' } } },
            },
            {
              from: { element: { type: 'data' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'data'] } } } },
            },
            {
              from: { element: { type: 'application' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'data', 'application'] } } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['domain', 'application', 'shared', 'theme', 'feature'] },
                  },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'shared', 'theme'] } } } },
            },
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'application', 'core'] } } } },
            },
            {
              from: { element: { type: 'theme' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'theme'] } } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier,
]);
