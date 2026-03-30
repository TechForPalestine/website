import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";

export default [
  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Astro recommended rules
  ...eslintPluginAstro.configs.recommended,

  // Accessibility rules for JSX
  jsxA11y.flatConfigs.recommended,

  // Disable ESLint rules that conflict with Prettier
  prettierConfig,

  {
    rules: {
      // Downgrade any → warn to allow gradual cleanup
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // These a11y rules require non-trivial UX refactoring — tracked as warnings
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
    },
  },

  // Astro boilerplate — triple-slash reference is intentional
  {
    files: ["src/env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      // Dead/legacy pages scheduled for removal
      "src/pages/projects-old.astro",
      "src/pages/donate-2.astro",
    ],
  },
];
