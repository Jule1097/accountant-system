import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const RESTRICTED_DOMAIN_CLASSES = ["Sale", "Purchase", "Voucher", "Money", "ThirdParty"];
const domainClassesPattern = `^(${RESTRICTED_DOMAIN_CLASSES.join("|")})$`;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `BinaryExpression[operator='instanceof'][right.name=/${domainClassesPattern}/]`,
          message: "Use polymorphic dispatch instead of instanceof for domain classes.",
        },
        {
          selector: "TSAsExpression > TSUnknownKeyword",
          message: "Do not cast through unknown; use the explicit boundary type.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/scripts/build-worker.js",
  ]),
]);

export default eslintConfig;
