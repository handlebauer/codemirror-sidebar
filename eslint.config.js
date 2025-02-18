import eslint from '@eslint/js'
import * as tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/examples/**',
            '**/.next/**',
            '**/*.d.ts',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,tsx}'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            prettier: eslintPluginPrettier,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-unused-expressions': [
                'error',
                { allowTaggedTemplates: true },
            ],
        },
    },
    prettierConfig,
]
