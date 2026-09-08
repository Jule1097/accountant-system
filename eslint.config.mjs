import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import domainInstanceofRule from "./eslint-rules/no-domain-instanceof.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "architecture/no-domain-instanceof": "error",
      "no-restricted-syntax": ["error", { selector: "TSAsExpression > TSUnknownKeyword", message: "Do not cast through unknown; use the explicit boundary type." }],
    },
    plugins: { architecture: { rules: { "no-domain-instanceof": domainInstanceofRule } } },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/scripts/build-worker.js",
  ])
]);

export default eslintConfig;
