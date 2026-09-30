import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      ".astro/",
      ".wrangler/",
      "node_modules/",
      "public/",
      "security_audit/",
      ".claude/",
      // Abandoned redesign (#524): unreachable, kept only to avoid a deletion diff
      "src/pages/*-new.astro",
      "src/layouts/HomeLayout.astro",
      // astro-eslint-parser cannot parse the inline <script type="speculationrules"> JSON block
      "src/layouts/Layout.astro",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Existing code uses `any` in places (e.g. getEnv locals); surfaced as a warning to fix incrementally
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
      // Newer core rules; existing code trips them, so surface without failing CI
      "no-useless-assignment": "warn",
      "preserve-caught-error": "warn",
    },
  },
  {
    // Inline <script> blocks run as-is in the browser (analytics/consent snippets use var and arguments)
    files: ["**/*.astro", "**/*.astro/**"],
    rules: { "no-var": "off", "prefer-rest-params": "off" },
  },
  {
    // Astro-generated file; the triple-slash reference is the documented form
    files: ["src/env.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: { "no-console": "off", "@typescript-eslint/no-explicit-any": "off" },
  }
);
