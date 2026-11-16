import { defineConfig, globalIgnores } from "eslint/config";
import next from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import typescript from "typescript-eslint";

export default defineConfig([
  globalIgnores([".next/**", "src/generated/**", "next-env.d.ts"]),
  ...typescript.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": next },
    rules: { ...next.configs.recommended.rules, ...next.configs["core-web-vitals"].rules },
  },
  { ...reactHooks.configs.flat.recommended, files: ["src/**/*.{ts,tsx}"] },
]);
