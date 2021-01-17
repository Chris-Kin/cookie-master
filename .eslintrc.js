'use strict';

module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
    },
    extends: ['airbnb'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-undef': 'off',
        'max-params': ['warn', 4],
        'no-nested-ternary': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        'no-undefined': 'off',
        'no-redeclare': 'error',
        'prettier/prettier': [
            'warn',
            {
                tabWidth: 4,
                singleQuote: true,
                semi: true,
                trailingComma: 'es5',
            },
        ],
        'lines-between-class-members': [
            'error',
            'always',
            { exceptAfterSingleLine: true },
        ],
    },
};
