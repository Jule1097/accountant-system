## 1. Database Schema Updates

- [ ] 1.1 Add `PerceptionConcept` model to `prisma/schema.prisma`
- [ ] 1.2 Add `VoucherPerception` model to `prisma/schema.prisma` with relation to `Voucher` and `PerceptionConcept`
- [ ] 1.3 Add `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` fields (Decimal) to `Voucher` model
- [ ] 1.4 Update documentation comments in `Voucher` model regarding `totalAmount` and `netAmount` calculation
- [ ] 1.5 Run `npx prisma format` and `npx prisma validate`

## 2. Migration and Prisma Client

- [ ] 2.1 Generate and apply a new Prisma migration (e.g. `npx prisma migrate dev --name add_perceptions_and_taxes`)
- [ ] 2.2 Run `npx prisma generate` to update the Prisma Client locally

## 3. Zod Schemas Update

- [ ] 3.1 Update `src/lib/schemas/voucher-schemas.ts` to include the new fields (`nonTaxableAmount`, `exemptAmount`, `otherTaxesAmount`)
- [ ] 3.2 Add Zod schemas for `PerceptionConcept` and `VoucherPerception` in `src/lib/schemas/voucher-schemas.ts` if needed for validation

## 4. Verification

- [ ] 4.1 Run unit and integration tests (Jest) to ensure existing tests pass and the schema compiles properly
- [ ] 4.2 Verify new fields and tables appear correctly in Prisma Studio or psql

## 5. Test Data Import (Seed/CSV)

- [ ] 5.1 Check if a CSV parser (e.g., `csv-parse`) is installed, and add it to `package.json` if necessary
- [ ] 5.2 Create a Node.js script (e.g. `scripts/import-teem-vouchers.ts`) to read BOTH CSV files ("Facturacion y gastos" para ventas, y "Ventas" para compras) on `csv` folder .
- [ ] 5.3 Implement logic in the script to resolve `companyId`, `clientId`/`supplierId` (upserting if needed), and catalogs (`VoucherType`, `VoucherLetter`)
- [ ] 5.4 Add logic to the script to handle missing CUITs/invoice numbers (use generic fallback values), ignore 'Centro de Costos', and recalculate `totalAmount` from positive components
- [ ] 5.5 Execute the script to import a random sample of 5 records per month from each file for testing
