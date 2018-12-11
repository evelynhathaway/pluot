module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"plugins": [
		"node",
		"mocha",
		"typescript"
	],
	"parserOptions": {
		"sourceType": "module",
		"ecmaVersion": 2018
	},
	"extends": [
		"eslint:recommended",
		"plugin:node/recommended"
	],
	"rules": {
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1
			}
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"warn",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"no-extra-semi": "warn",
		"no-var": "error",
		"no-console": "error",
		"no-throw-literal": "error",
		"quote-props": [
			"warn",
			"as-needed",
			{
				"unnecessary": false,
				"numbers": true
			}
		],
		"no-fallthrough": [
			"error",
			{
				"commentPattern": "falls?\\s?through|break"
			}
		]
	},
	"overrides": [
		// TypeScript
		{
			"files": [
				"**/*.ts"
			],
			"parser": "typescript-eslint-parser",
			"rules": {
				"no-unused-vars": "warn", // Falsely triggers on types
				"node/no-unsupported-features/es-syntax": "off",
				"node/no-unsupported-features/es-builtins": "off",
				"typescript/adjacent-overload-signatures": "error",
				"typescript/class-name-casing": "error",
				"typescript/no-type-alias": "off",
				"typescript/explicit-member-accessibility": "error",
				"typescript/member-ordering": "error",
				"typescript/no-angle-bracket-type-assertion": "error",
				"typescript/no-empty-interface": "error",
				"typescript/prefer-namespace-keyword": "error",
				"typescript/no-namespace": "error",
				"typescript/no-parameter-properties": "error",
				"typescript/no-triple-slash-reference": "error",
				"typescript/no-var-requires": "error"
			}
		},
		// Mocha tests
		{
			"files": [
				"test/**/*.js"
			],
			"env": {
				"mocha": true
			},
			"rules": {
				"mocha/handle-done-callback": "error",
				"mocha/no-exclusive-tests": "error",
				"mocha/no-global-tests": "warn",
				"mocha/no-identical-title": "error",
				"mocha/no-mocha-arrows": "warn",
				"mocha/no-nested-tests": "error",
				"mocha/no-pending-tests": "warn",
				"mocha/no-return-and-callback": "error",
				"mocha/no-sibling-hooks": "error",
				"mocha/no-skipped-tests": "warn",
				"mocha/no-top-level-hooks": "error",
				// Allow for dev dependencies
				"node/no-unpublished-require": "off"
			}
		}
	]
};
