## Why

The current database schema was designed assuming that all tax withholdings are handled through retentions that reduce the liquid amount of a voucher. That logic is valid for sales vouchers, but it fails to support purchase vouchers where perceptions must increase the total amount owed. The system also needs to separate exempt, non-taxable amounts, and other taxes to generate accurate VAT books, AFIP reports, and analytics.

## What Changes

- Keep `RetentionConcept` and `VoucherRetention` exclusive to sales vouchers, where retentions reduce the liquid amount to collect.
- Create a new catalog model `PerceptionConcept` to define generic purchase perception concepts such as `Percepcion de Ingresos Brutos` and `Percepcion de IVA`.
- Create a shared catalog model for tax jurisdictions detected in the current CSV sources, and use relations from both sales retentions and purchase perceptions instead of free-text jurisdiction names.
- Create a new transactional model `VoucherPerception` to record the perceptions applied to purchase vouchers, storing the amount plus an optional jurisdiction relation when the source data is jurisdiction-specific.
- Modify the `Voucher` model to include `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` fields.
- Update the mathematical formula documented in the `Voucher` model for purchase vouchers so `totalAmount` includes subtotal, VAT, perceptions, exempt amount, non-taxable amount, and other taxes.
- Update the voucher creation and editing flow, backend services, analytics, and import utilities so the new fields and perception model are fully usable end-to-end.
- Update the purchases and sales tables so they present a compact spreadsheet-like structure inspired by the CSV files, including separate `letter` and voucher number columns plus the operational columns `concept`, `paymentMethod`, `status`, `paymentDate`, `paidAmount`, and `comments`.
- Add a voucher detail modal opened from the purchases and sales tables that shows the retention or perception breakdown for the selected voucher and exposes an editable UI state for those fields without persisting the edits to the database in this feature.
- Persist Credit Note monetary amounts as absolute values and make them subtract through domain logic, analytics, and reporting behavior rather than storing negative amounts.
- Normalize Client and Supplier CUIT values into the `XX-XXXXXXXX-X` format before persistence.
- Add a temporary import script that maps the sample CSV files `2026 - Compras.csv` and `2026 - Teem - Facturacion y gastos 2026.csv` into the normalized database structure. The CSV format is only an input source for sample data and will not define the final persistence model.

## Capabilities

### New Capabilities
- `voucher-taxes-and-perceptions`: Management of purchase perceptions, exempt amounts, non-taxable amounts, and other taxes at the voucher level.

### Modified Capabilities
- Voucher persistence, validation, import, and analytics logic must distinguish sales retentions from purchase perceptions.
- Voucher list UIs for purchases and sales must display compact totals in the grid and expose a drill-down modal for detailed taxes and operational fields.

## Impact

- `prisma/schema.prisma`: Jurisdiction catalog relations, perception models, and additional voucher amount fields will be introduced or extended.
- Prisma Client Generator: Must be updated to reflect the new fields and relationships.
- `src/models/Voucher.ts`, voucher schemas, repositories, services, analytics, parser flows, voucher tables, and voucher modal UI will need coordinated updates so purchase perceptions, jurisdictions, and additional tax fields behave consistently across the application.
