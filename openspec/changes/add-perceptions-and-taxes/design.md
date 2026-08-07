## Context

Currently, the `Voucher` model subtracts `VoucherRetention` records from the `totalAmount` to get the `netAmount`. Purchase invoices, however, require adding perceptions to the gross value. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Provide a database structure to store perceptions that add to the voucher total.
- Separate exempt and non-taxable amounts explicitly in the voucher to support reporting.

**Non-Goals:**
- Do not modify how existing `VoucherRetention` records work. Retentions will continue to be subtracted to calculate the `netAmount`.

## Decisions

- **Decision 1: Separate tables for Perceptions vs. Unified Tax Table**
  - **Rationale:** We chose to create `PerceptionConcept` and `VoucherPerception` instead of merging retentions and perceptions into a single `VoucherTax` table. This provides a clearer conceptual separation in code and directly mirrors the AFIP accounting model where perceptions and retentions occur at different moments (invoicing vs. payment).
  - **Alternatives:** A unified `VoucherTax` table with a `taxBehavior` ('perception' | 'retention') flag. Rejected because it complicates queries and increases the risk of calculation bugs if a flag is misread.

- **Decision 2: Flat fields for non-taxable amounts**
  - **Rationale:** We add `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` directly to the `Voucher` model rather than creating a many-to-many relationship for "Voucher Concepts". This aligns with standard AFIP invoice layouts and simplifies database queries when generating VAT books.

## Risks / Trade-offs

- **Risk: Breaking changes to frontend calculations**
  - **Mitigation:** The backend changes strictly additive fields. However, any existing frontend logic that blindly relies on `totalAmount = subtotal + vatAmount` will need to be updated to sum the new fields and perceptions. We will add a task to update Prisma Client and review any hardcoded math in services.
