import { RuleTester } from "eslint"
import type { Rule } from "eslint"
import domainInstanceofRule from "../../../../eslint-rules/no-domain-instanceof.js"

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: "module" } })
const typedDomainInstanceofRule = domainInstanceofRule as Rule.RuleModule

ruleTester.run("no-domain-instanceof", typedDomainInstanceofRule, {
  valid: [
    "value instanceof Error",
    "value instanceof Date",
    "value instanceof Decimal",
    "value instanceof ExternalType",
  ],
  invalid: [
    {
      code: 'import { Sale } from "src/models/voucher/Sale"; value instanceof Sale',
      errors: [{ messageId: "domainInstanceof" }],
    },
    {
      code: 'import { Purchase as PurchaseVoucher } from "src/models/voucher/Purchase"; value instanceof PurchaseVoucher',
      errors: [{ messageId: "domainInstanceof" }],
    },
  ],
})
