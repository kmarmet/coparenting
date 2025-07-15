// Path: eslint.config.mjs
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export default [
    {files: []},
    {languageOptions: {globals: globals.browser}},
    pluginJs.configs.recommended,
    pluginReact.configs.flat.recommended,

    {
        env: {
            browser: true,
            es2021: true,
        },
        rules: {
            'react/prop-types': 'off',
        },
    },
]