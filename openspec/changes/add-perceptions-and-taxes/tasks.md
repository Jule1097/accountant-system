## 1. Database Schema Updates

- [x] 1.1 Add `PerceptionConcept` model to `prisma/schema.prisma`
- [x] 1.2 Add `VoucherPerception` model to `prisma/schema.prisma` with relation to `Voucher` and `PerceptionConcept`, including optional `province` / `jurisdiction`
- [x] 1.3 Add `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` fields (Decimal) to `Voucher` model
- [x] 1.4 Keep `VoucherRetention` exclusive to sales vouchers and document the separation between sales retentions and purchase perceptions in the Prisma schema and related metadata
- [x] 1.5 Update documentation comments in `Voucher` model regarding purchase `totalAmount` calculation, sales `netAmount` calculation, and Credit Note positive persistence
- [x] 1.6 Run `pnpm exec prisma format` and `pnpm exec prisma validate`

## 2. Migration and Prisma Client

- [x] 2.1 Generate and apply a new Prisma migration (e.g. `pnpm exec prisma migrate dev --name add_perceptions_and_taxes`)
- [x] 2.2 Run `pnpm exec prisma generate` to update the Prisma Client locally

## 3. Zod Schemas Update

- [x] 3.1 Update `src/lib/schemas/voucher.ts` to include the new fields (`nonTaxableAmount`, `exemptAmount`, `otherTaxesAmount`) and the sales/purchase separation rules
- [x] 3.2 Add Zod schemas for `PerceptionConcept` and `VoucherPerception` in `src/lib/schemas/voucher.ts` if needed for validation
- [x] 3.3 Normalize Client and Supplier CUIT values into `XX-XXXXXXXX-X` format during validation or data preparation

## 4. Domain, Repositories, Services, and UI

- [x] 4.1 Update `src/models/Voucher.ts` to calculate purchase totals with perceptions and additional tax fields, keep sales retentions exclusive to net deductions, and make Credit Notes subtract through domain logic while staying positive in persistence
- [x] 4.2 Update voucher repositories and services to persist and load `VoucherPerception`, the new voucher amount fields, and the Credit Note sign rules consistently
- [x] 4.3 Update voucher create/edit flows, including parser-to-form mapping and UI inputs, so purchases can manage perceptions, exempt amounts, non-taxable amounts, and other taxes end-to-end
- [x] 4.4 Update analytics and reporting calculations so Credit Notes subtract by voucher type logic and purchase perceptions are reflected in real totals

## 5. Verification

- [x] 5.1 Run unit and integration tests (Jest) to ensure existing tests pass and the schema compiles properly
- [x] 5.2 Add or update tests for voucher domain logic, validation, import mapping, and analytics behavior covering purchase perceptions and Credit Notes
- [x] 5.3 Verify new fields and tables appear correctly in Prisma Studio or psql

## 6. Test Data Import (Seed/CSV)

- [x] 6.1 Check if a CSV parser (e.g., `csv-parse`) is installed, and add it to `package.json` if necessary
- [x] 6.2 Create a Node.js script (e.g. `scripts/import-teem-vouchers.ts`) to read `2026 - Compras.csv` and `2026 - Teem - Facturacion y gastos 2026.csv` from the `csv` folder
- [x] 6.3 Implement logic in the script to resolve `companyId`, `clientId` / `supplierId` (upserting if needed), normalize CUITs, and resolve catalogs (`VoucherType`, `VoucherLetter`, `PerceptionConcept`)
- [x] 6.4 Add logic to the script to map jurisdiction-specific CSV columns into generic `PerceptionConcept` values plus `province` / `jurisdiction`, ignore `Centro de Costos`, and recalculate `totalAmount` from positive components
- [x] 6.5 Add logic to import Credit Notes as positive persisted values while preserving their subtractive business effect
- [x] 6.6 Execute the script to import a random sample of 5 records per month from each file for testing

## 7. Shared Jurisdictions Catalog

- [x] 7.1 Add a shared jurisdiction catalog model to `prisma/schema.prisma` and replace free-text jurisdiction storage in sales retentions and purchase perceptions with relations to that catalog
- [x] 7.2 Generate and apply the corresponding Prisma migration, then regenerate the Prisma Client
- [x] 7.3 Seed only the jurisdictions currently present in `2026 - Compras.csv` and `2026 - Teem - Facturacion y gastos 2026.csv`
- [x] 7.4 Update repositories, services, parser mapping, import script, analytics, and tests to use the jurisdiction relation instead of text values
- [x] 7.5 Extend `/api/catalogs` so voucher forms can load the shared jurisdiction options

## 8. Purchases and Sales Tables

- [x] 8.1 Update the purchases and sales table UIs to show compact spreadsheet-like grids inspired by the CSVs, with separate columns for voucher letter and voucher number
- [x] 8.2 Add the operational columns `concept`, `paymentMethod`, `status`, `paymentDate`, `paidAmount`, and `comments` to the corresponding purchases and sales tables
- [x] 8.3 Show compact aggregate totals for perceptions in purchases and retentions in sales instead of expanding one visible column per jurisdiction in the grid
- [x] 8.4 Add a voucher detail modal opened from the tables that shows the breakdown of retentions or perceptions by concept and jurisdiction
- [x] 8.5 Make the voucher detail modal editable only at the UI/form-state level for this feature, without persisting changes to the database yet
- [x] 8.6 Add or update tests to cover jurisdiction selection, compact table rendering, and the non-persistent editable detail modal behavior
