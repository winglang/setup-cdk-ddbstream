// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
	eslint.configs.recommended,
	tseslint.configs.eslintRecommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		ignores: ["cdk.out/", "node_modules/"],
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			extensions: { rules: await import("./eslint.extensions-rule.js") },
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/no-unused-vars": "warn",
			"no-mixed-spaces-and-tabs": "off",
			"extensions/extensions": "error",
		},
	},
);
