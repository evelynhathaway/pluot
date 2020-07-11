module.exports = {
	"plugins": [
		"evelyn",
	],
	"extends": [
		"plugin:evelyn/default",
		"plugin:evelyn/node",
		"plugin:evelyn/source",
	],
	"overrides": [
		// TypeScript
		{
			"files": [
				"**/*.ts",
			],
			"extends": [
				"plugin:evelyn/typescript",
			],
		},
		// Mocha tests
		{
			"files": [
				"test/**/*.js"
			],
			"extends": [
				"plugin:evelyn/mocha",
			],
		}
	]
};
