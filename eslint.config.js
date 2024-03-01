// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { extensions } from "./extensions-rule.js";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		plugins: {
			extensions: { rules: { extensions } },
		},
		rules: {
			"extensions/extensions": "error",
		},
	},
);
