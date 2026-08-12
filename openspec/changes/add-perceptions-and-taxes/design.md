## Context

Currently, the `Voucher` model subtracts `VoucherRetention` records from `totalAmount` to derive `netAmount`. That behavior should remain valid for sales vouchers only. Purchase vouchers require a separate perception model that increases the total amount owed, plus explicit fields for exempt, non-taxable, and other tax amounts. The change must also leave the flow ready across validation, persistence, import, UI, and analytics.

## Goals / Non-Goals

**Goals:**
- Provide a database structure to store purchase perceptions that add to the voucher total.
- Provide a shared jurisdiction catalog used by both sales retentions and purchase perceptions.
- Separate exempt and non-taxable amounts explicitly in the voucher to support reporting.
- Keep sales retentions and purchase perceptions as distinct concepts across the schema, domain logic, import flow, and analytics.
- Leave the voucher creation, edition, import, analytics, and voucher table flows ready to consume the new fields end-to-end.
- Present compact purchases and sales grids with drill-down voucher detail modals.

**Non-Goals:**
- Do not repurpose `VoucherRetention` for purchases.
- Do not couple the final persistence model to the temporary CSV layout.
- Do not build a jurisdiction ABM module in this feature.
- Do not implement database persistence for edits made from the voucher detail modal in this feature.

## Decisions

- **Decision 1: Separate tables for purchase perceptions**
  - **Rationale:** We chose to create `PerceptionConcept` and `VoucherPerception` instead of reusing `RetentionConcept` and `VoucherRetention` for purchases. This keeps the accounting model explicit and avoids mixing deductions from sales with additive taxes from purchases.
  - **Alternatives:** Reusing `RetentionConcept` or introducing a single `VoucherTax` table with a behavior flag. Rejected because both options blur the accounting meaning and make validation and analytics more error-prone.

- **Decision 2: Strict sales vs. purchases separation**
  - **Rationale:** `VoucherRetention` remains exclusive to sales vouchers, while `VoucherPerception` becomes exclusive to purchase vouchers. This matches the business rule that sales vouchers register retentions that reduce the liquid amount to collect, while purchase vouchers register perceptions that increase the total amount owed.
  - **Alternatives:** Allowing both retentions and perceptions on both voucher types. Rejected because it contradicts the accounting model defined for this project and would blur validation, import, and reporting rules.

- **Decision 3: Flat fields for non-taxable amounts**
  - **Rationale:** We add `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` directly to the `Voucher` model rather than creating a many-to-many relationship for extra tax concepts. This aligns with standard AFIP invoice layouts and simplifies database queries when generating VAT books.

- **Decision 4: Shared jurisdiction catalog derived from current CSV scope**
  - **Rationale:** Both `VoucherRetention` and `VoucherPerception` will reference a shared jurisdiction catalog instead of storing free-text province values. The initial catalog will only contain the jurisdictions currently present in the CSV files. This prevents naming drift in the UI, import process, analytics, and future filters while keeping the scope bounded.
  - **Alternatives:** Keeping `province` as free text or seeding all 24 Argentine jurisdictions now. Rejected because free text breaks consistency and a full country-wide catalog is unnecessary for the current scope.

- **Decision 5: Positive persistence for Credit Notes**
  - **Rationale:** Credit Notes will persist absolute monetary values in the database and subtract through domain logic derived from `VoucherType`. This keeps persistence consistent while still producing the correct accounting and analytical behavior.
  - **Alternatives:** Storing Credit Notes as negative values. Rejected because it makes imports, validations, and queries more fragile.

- **Decision 6: Import script as a transient adapter**
  - **Rationale:** The CSV files are only used to populate realistic sample data. The import script will translate the source columns into the normalized database structure and can be removed after the test data is loaded.
  - **Alternatives:** Modeling the database directly after the CSV layout. Rejected because it would couple the final system to a temporary source file.

- **Decision 7: Compact voucher tables plus editable detail modal**
  - **Rationale:** The purchases and sales tables will remain compact and spreadsheet-like by showing only aggregate totals for retentions or perceptions in the grid. Clicking a voucher will open a modal with the full operational detail and the tax breakdown for that voucher. The modal fields will be editable in the UI to validate the future workflow, but saving those edits to the database is explicitly deferred to a later feature.
  - **Alternatives:** Expanding every jurisdiction column directly in the grid or implementing full persistence now. Rejected because the grid would become too wide and persistence belongs to a later scoped feature.

## Risks / Trade-offs

- **Risk: Breaking changes to existing voucher calculations**
  - **Mitigation:** Any logic that assumes `totalAmount = subtotal + vatAmount` must be updated to include the new purchase fields and perceptions. The implementation must review the voucher domain model, repositories, services, parser, form state, and analytics calculations together.

- **Risk: Analytics inconsistency for Credit Notes**
  - **Mitigation:** Since Credit Notes will persist as positive values, analytics and reporting logic must derive their negative business effect from voucher type instead of assuming raw database sign.

- **Risk: Import ambiguity from jurisdiction-specific CSV columns**
  - **Mitigation:** The import script will contain an explicit mapping table from each CSV column into a generic `PerceptionConcept` plus a jurisdiction catalog entry.

- **Risk: UI expectations around editable voucher detail**
  - **Mitigation:** The artifacts and UI copy must make clear that the detail modal allows editing the form state only in this feature, while persistence is intentionally deferred.
