import globals from 'globals';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import stylistics from '@stylistic/eslint-plugin';

export default tsEslint.config(
    eslint.configs.recommended,
    ...tsEslint.configs.recommendedTypeChecked,
    {
        name: 'knot-eslint-plugin',
        plugins: {
            '@typescript-eslint': tsEslint.plugin,
            '@stylistics': stylistics
        },
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly',
            },

            parser: tsEslint.parser,
            ecmaVersion: 2022,
            sourceType: 'module',

            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'no-async-promise-executor': 'off',
            'no-return-await': 'off',
            'no-unused-expressions': 'off',

            '@stylistics/semi': ['error', 'always'],
            '@stylistics/indent': 'off',
            '@stylistics/quotes':  ['error', 'single', {
                avoidEscape: true,
                allowTemplateLiterals: true,
            }],
            '@stylistics/quote-props': ['error', 'as-needed'],
            '@stylistics/eol-last': ['error', 'always'],
            '@stylistics/no-extra-parens': ['error', 'all'],
            '@stylistics/object-curly-spacing': ['error', 'always'],
            '@stylistics/block-spacing': ['error', 'always'],
            '@stylistics/space-in-parens': ['error'],
            '@stylistics/no-tabs': ['error'],
            '@stylistics/no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0, 'maxBOF': 0 }],
            '@stylistics/no-trailing-spaces': ['error'],
            '@stylistics/brace-style': ['error', 'allman', {
                allowSingleLine: true,
            }],
            '@stylistics/semi-spacing': 'error',
            '@stylistics/array-bracket-spacing': ['error', 'never'],
            '@stylistics/member-delimiter-style': ['error', {
                'multiline': {
                    'delimiter': 'semi',
                    'requireLast': true
                },
                'singleline': {
                    'delimiter': 'comma',
                    'requireLast': false
                }
            }],
            '@stylistics/comma-spacing': ['error'],
            '@stylistics/comma-dangle': ['error', 'only-multiline'],
            '@stylistics/keyword-spacing': ['error'],
            '@stylistics/spaced-comment': ['error'],

            '@typescript-eslint/return-await': 'error',
            '@typescript-eslint/no-unused-expressions': 'error',
            '@typescript-eslint/no-inferrable-types': ['error', {
                'ignoreProperties': true
            }],
            '@typescript-eslint/no-explicit-any': ['off'],
            '@typescript-eslint/no-unsafe-argument': ['warn'],
            '@typescript-eslint/no-unsafe-assignment': ['off'],
            '@typescript-eslint/no-unsafe-member-access': ['off'],
            '@typescript-eslint/no-this-alias': ['off'],
            '@typescript-eslint/no-unsafe-call': ['warn']
        }
    }
);
