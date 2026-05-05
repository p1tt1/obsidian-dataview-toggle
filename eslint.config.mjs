import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default tseslint.config(
  ...obsidianmd.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "no-unsanitized": noUnsanitized },
    rules: {
      "no-unsanitized/method": "error",
      "no-unsanitized/property": "error",
      "@typescript-eslint/require-await": "error",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "manifest.json"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  {
    // Test files run in Node via Vitest — Node.js built-in imports are intentional.
    files: ["src/__tests__/**/*.ts"],
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
    },
  },
  {
    ignores: [
      "node_modules",
      "main.js",
      "esbuild.config.mjs",
      "version-bump.mjs",
    ],
  },
);
