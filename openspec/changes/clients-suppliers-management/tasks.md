## 1. OpenSpec Alignment

- [x] 1.1 Add the `clients-suppliers` capability spec covering routes, tabs, table behavior, CRUD flows, duplicate rules, and deletion blocking
- [x] 1.2 Modify the `voucher-tables` capability spec to include inline client and supplier creation from the voucher modal

## 2. Client and Supplier API Contracts

- [x] 2.1 Add dedicated list query schemas and response types for clients and suppliers aligned with the vouchers pagination contract
- [x] 2.2 Extend `/api/clients` and `/api/suppliers` list handlers to support server-side pagination, search, ordering, totals, and extensible filters
- [x] 2.3 Add consistent Spanish error responses for duplicate name, duplicate CUIT, missing record, and blocked deletion cases

## 3. Duplicate Rules and Deletion Constraints

- [x] 3.1 Update client and supplier services to enforce duplicate CUIT per company and entity type using existing CUIT normalization
- [x] 3.2 Add normalized name duplicate validation per company and entity type using trim plus case-insensitive comparison
- [x] 3.3 Block deletion when the selected client or supplier is referenced by persisted vouchers

## 4. Clients and Suppliers Management UI

- [x] 4.1 Add `/clients` and `/suppliers` dashboard routes using one shared management container with route-driven tabs
- [x] 4.2 Build the shared management table with server-side pagination, search, ordering, totals, and an extensible filter configuration
- [x] 4.3 Add modal create, view, edit, and delete-confirmation flows for clients and suppliers with Spanish user-facing copy

## 5. Voucher Inline Third-Party Creation

- [x] 5.1 Extend voucher form option loading so client and supplier lists can be refreshed after inline creation without losing voucher state
- [x] 5.2 Add create-only inline client or supplier modal actions in the shared voucher form, with optional prefilling from AI-detected name and CUIT
- [x] 5.3 After inline create, auto-select the created or resolved record, keep the voucher modal open, and preserve parsed voucher values
- [x] 5.4 When inline creation hits a duplicate, attempt to resolve the existing record and auto-select it before surfacing a toast failure
- [x] 5.5 Make the inline third-party create flow available both for direct individual voucher creation and for single-item conciliation review flows that reuse the shared voucher modal

## 6. Voucher Type And Letter Parsing Fix

- [x] 6.1 Replace exact-only parsed voucher type and voucher letter resolution with tolerant normalization that can handle combined labels and MiPyME naming variants
- [x] 6.2 Ensure parser-to-form mapping resolves combined labels such as `Factura A`, `Nota de Crédito A`, and MiPyME variants into the correct select-backed ids
- [x] 6.3 Keep exact catalog matches as the highest-priority resolution path before tolerant fallback logic

## 7. Verification

- [x] 7.1 Add or update Jest coverage for client and supplier list queries, duplicate rules, deletion blocking, and route-driven tabs
- [x] 7.2 Add or update Jest coverage for voucher inline client and supplier creation, option refresh, duplicate resolution, and toast handling
- [x] 7.3 Add or update Jest coverage for parsed voucher type and voucher letter mapping, including invoice, credit note, and MiPyME label variants
- [x] 7.4 Run the relevant Jest suites for clients, suppliers, vouchers, parser mapping, and shared management helpers before handoff
