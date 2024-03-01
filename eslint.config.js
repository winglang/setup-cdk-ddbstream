// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { extensions } from "./src/extensions-rule.js";

export default tseslint.config(
	{
		ignores: ["cdk.out/", "node_modules/"],
	},
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
	eslint.configs.recommended,
	tseslint.configs.eslintRecommended,
	...tseslint.configs.recommendedTypeChecked,
	// ...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": "error",
			// "@typescript-eslint/no-unsafe-argument": "warn",
			// "@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
	{
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			extensions: { rules: { extensions } },
		},
		rules: {
			"extensions/extensions": "error",
		},
	},
);
