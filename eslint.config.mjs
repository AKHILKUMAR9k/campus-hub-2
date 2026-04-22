import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "next": nextPlugin,
      "react": reactPlugin,
      "react-hooks": hooksPlugin,
      "@typescript-eslint": tsPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...Object.fromEntries(
        Object.entries(nextPlugin.configs.recommended.rules).map(([k, v]) => [k.replace('@next/next/', 'next/'), v])
      ),
      ...Object.fromEntries(
        Object.entries(nextPlugin.configs['core-web-vitals'].rules).map(([k, v]) => [k.replace('@next/next/', 'next/'), v])
      ),
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
