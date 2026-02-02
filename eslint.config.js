import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  { ignores: ['dist', 'node_modules', 'build', '.firebase'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: '19.2' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // React specific
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Production safety
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn on console.log
      'no-debugger': 'error', // No debugger in production
      'no-alert': 'warn', // Avoid alerts

      // Code quality
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-var': 'error', // Use let/const
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-duplicate-imports': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // Best practices
      'eqeqeq': ['error', 'always'], // Use === instead of ==
      'curly': ['error', 'all'], // Always use curly braces
      'no-eval': 'error', // No eval()
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'warn',

      // Security
      'no-script-url': 'error', // No javascript: URLs
      'no-inline-comments': 'off', // Allow inline comments
    },
  },
];
