## Why

The product already has backend CRUD primitives for clients and suppliers, but it still lacks a dedicated management module, consistent server-side table behavior, and a reliable inline creation flow when voucher parsing detects a third party that does not exist in the active company dataset. This leaves users without a place to manage the master data directly and breaks the voucher flow whenever AI identifies a CUIT that has not been registered yet.

## What Changes

- Add a dedicated "Clientes y Proveedores" management experience exposed through two routes, `/clients` and `/suppliers`, presented as one shared module with route-driven tabs.
- Introduce reusable server-driven management tables for clients and suppliers with pagination, search, ordering, totals, and an extensible filter contract aligned with the vouchers pattern.
- Add create, edit, view, and delete flows for clients and suppliers through dedicated modals, keeping `name` and `cuit` mandatory in every creation flow.
- Enforce uniqueness per active company and per entity type for both normalized CUIT and normalized name, while still allowing the same CUIT to exist in a client and a supplier because they represent different roles.
- Block deletion when the selected client or supplier is referenced by at least one persisted voucher, surfacing a Spanish confirmation/error experience through modal plus toast feedback.
- Extend voucher creation so users can create a missing client or supplier inline from the shared voucher modal, whether they are loading an individual voucher manually or reviewing a single staged voucher from conciliations, optionally prefilled with AI-detected values, then refresh and auto-select the created or resolved record without closing the voucher flow.
- Resolve inline duplicate creation attempts by trying to match the existing record and auto-selecting it before surfacing failure.
- Fix parsed voucher type and voucher letter resolution so the shared voucher modal can select the correct catalog-backed values even when AI returns combined or variant human-readable labels.

## Capabilities

### New Capabilities
- `clients-suppliers`: Defines the route structure, management tables, validation rules, CRUD behavior, and deletion constraints for company-scoped client and supplier records.

### Modified Capabilities
- `voucher-tables`: Extends the shared voucher modal behavior so a missing client or supplier can be created inline and immediately selected without abandoning the voucher form.

## Impact

- Affects dashboard navigation and adds the new `/clients` and `/suppliers` route entries.
- Affects client and supplier REST endpoints, services, repositories, and schemas so they expose server-side list contracts and company-scoped duplicate enforcement by normalized name and CUIT.
- Affects voucher modal option loading and third-party selection flows so inline creation can refresh options, auto-select matches, and keep the voucher modal open.
- Affects parser-to-form mapping for `voucherTypeId` and `voucherLetterId` so select-backed voucher fields can resolve tolerant label variants.
- Requires Jest coverage for client/supplier list queries, duplicate rules, deletion blocking, route-driven tab behavior, voucher inline third-party creation flows, and voucher type/letter parsing variants.
