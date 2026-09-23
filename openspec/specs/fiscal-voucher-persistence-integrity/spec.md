# fiscal-voucher-persistence-integrity Specification

## Purpose

Guarantee that concurrent persistence paths cannot create duplicate fiscal vouchers while preserving permitted non-fiscal duplicate behavior.

## Requirements

### Requirement: Fiscal voucher identity is unique

The system MUST persist at most one fiscal voucher for a given company and fiscal document identity. Fiscal identity MUST include the voucher workflow type, voucher type, voucher letter, point of sale, voucher number, and the applicable party identifier: client for sales or supplier for purchases. The uniqueness guarantee MUST treat absent applicable party identifiers consistently with the existing fiscal duplicate-detection behavior.

#### Scenario: Same fiscal sales voucher is persisted twice

- **WHEN** two persistence operations attempt to create sales vouchers with the same company, fiscal document identity, and client
- **THEN** the system MUST persist only one voucher
- **AND** the other operation MUST resolve as a duplicate

#### Scenario: Same fiscal purchase voucher is persisted twice

- **WHEN** two persistence operations attempt to create purchase vouchers with the same company, fiscal document identity, and supplier
- **THEN** the system MUST persist only one voucher
- **AND** the other operation MUST resolve as a duplicate

#### Scenario: Fiscal documents belong to different companies

- **WHEN** two fiscal vouchers have the same document identity but belong to different companies
- **THEN** the system MUST allow both vouchers to be persisted

### Requirement: Concurrent persistence resolves duplicate outcomes

The system MUST preserve real-voucher uniqueness whether a fiscal voucher is persisted individually, by a parser persistence batch, or by concurrent combinations of those paths. A uniqueness conflict MUST NOT be exposed as an internal error or leave the losing staged item in a generic failed state. After the winning voucher is persisted, every losing staged item MUST be removed from the operational conciliations dataset together with its temporary source file.

#### Scenario: Individual persistence races with a parser batch

- **WHEN** an individual persistence operation and a parser persistence batch concurrently persist separate staged items representing the same fiscal voucher
- **THEN** exactly one real voucher MUST be created
- **AND** the losing staged item MUST be removed from conciliations and its temporary source file MUST be deleted

#### Scenario: Two parser batches race

- **WHEN** independent parser persistence batches concurrently persist separate staged items representing the same fiscal voucher
- **THEN** exactly one real voucher MUST be created
- **AND** every losing staged item MUST be removed from conciliations and its temporary source file MUST be deleted

#### Scenario: Equivalent items are persisted from the same batch

- **WHEN** two distinct staged items in one parser batch represent the same fiscal voucher and are sent to persistence
- **THEN** exactly one real voucher MUST be created
- **AND** every losing staged item MUST be removed from conciliations and its temporary source file MUST be deleted

### Requirement: Technical persistence failures retain validated work

The system MUST preserve a staged item's validated payload when persistence fails for a reason other than a fiscal uniqueness conflict. The item MUST return to the validated workflow so saving can be retried, and it MUST NOT become eligible for parser regeneration.

#### Scenario: Persistence has a technical failure

- **WHEN** persistence of a validated staged item fails without a fiscal uniqueness conflict
- **THEN** the item MUST return to the `Validada` workflow with its validated payload preserved
- **AND** the system MUST allow saving to be retried

### Requirement: Non-fiscal duplicate behavior remains unchanged

The system MUST NOT apply fiscal-document uniqueness to non-fiscal purchases. Existing flows that explicitly allow a user to confirm a possible non-fiscal duplicate MUST remain available.

#### Scenario: User confirms a possible non-fiscal duplicate

- **WHEN** a user confirms creation of a non-fiscal purchase that matches an existing possible duplicate
- **THEN** the system MUST preserve the current confirmation behavior
- **AND** it MUST NOT reject the voucher because of the fiscal uniqueness guarantee

### Requirement: Safe uniqueness migration

Before enabling fiscal voucher uniqueness, the system MUST check existing fiscal vouchers for duplicate fiscal identities. If historical duplicates are present, the migration MUST stop without deleting, merging, or modifying any voucher records.

#### Scenario: Historical duplicates are detected

- **WHEN** the migration detects two or more existing fiscal vouchers with the same company and fiscal document identity
- **THEN** it MUST fail safely before enabling the uniqueness guarantee
- **AND** it MUST leave all existing voucher records unchanged for manual reconciliation

#### Scenario: No historical duplicates exist

- **WHEN** the migration finds no duplicate fiscal identities in existing data
- **THEN** it MUST enable the fiscal uniqueness guarantee
- **AND** subsequent concurrent persistence attempts MUST be protected by that guarantee
