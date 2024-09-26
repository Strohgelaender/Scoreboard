import globals from 'globals';
import pluginJs from '@eslint/js';
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

export default [
	{
		ignores: ['**/vendor/*.js'],
	},
	{
		files: ['src/**/*.js'],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			...pluginJs.configs.recommended.rules,
		},
	},
	{
		files: ['public/scripts/*.js', '!public/scripts/vendor/**/*.js'],
		languageOptions: { globals: { ...globals.browser } },
		rules: {
			...pluginJs.configs.recommended.rules,
		},
	},
	eslintPluginPrettierRecommended,
];
