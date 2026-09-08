## Purpose

Provide an independent voucher domain that expresses sales and purchase invariants, isolates persistence and external representations, and preserves current voucher calculations and contracts.

## ADDED Requirements

### Requirement: Voucher types enforce their domain invariants
The system SHALL represent sales and purchase vouchers as distinct concrete domain types named `Sale` and `Purchase`, extending an abstract `Voucher` base contract.

#### Scenario: Sales voucher requires a client
- **WHEN** a sales voucher is created or modified without a client
- **THEN** domain creation or modification fails with a typed validation error

#### Scenario: Purchase voucher requires a supplier
- **WHEN** a purchase voucher is created or modified without a supplier
- **THEN** domain creation or modification fails with a typed validation error

#### Scenario: Tax collections are exclusive by voucher type
- **WHEN** a sales voucher contains retentions or a purchase voucher contains perceptions
- **THEN** domain creation or modification fails with a typed validation error

### Requirement: Existing voucher calculations remain equivalent
The system SHALL preserve the current results of total, net, balance, signed value, status, duplicate comparison, exchange-rate, analytics-value, and recalculation behaviors.

#### Scenario: Existing valid voucher is rehydrated
- **WHEN** an existing persisted voucher is loaded
- **THEN** its domain calculations and derived status match the current behavior

#### Scenario: Voucher recalculation is applied
- **WHEN** a voucher is recalculated with valid changes
- **THEN** all current dependent amounts and derived values remain equivalent to the existing contract

### Requirement: Domain monetary operations are independent of Prisma
The system SHALL represent monetary values through a system-owned `Money` value object with an extensible currency representation, independent of Prisma decimal types, that always stores two decimal places and rounds results to two decimal places using half-up rounding.

#### Scenario: Monetary values are calculated precisely
- **WHEN** a domain operation adds, subtracts, compares, or signs monetary values
- **THEN** the result is rounded to two decimal places and rejects incompatible currencies where the operation requires the same currency

#### Scenario: Money is exposed to the frontend
- **WHEN** a domain value is mapped to an API response
- **THEN** the amount is serialized as a two-decimal string and currency is serialized using its canonical extensible code

#### Scenario: Persistence mapper converts monetary values
- **WHEN** a domain voucher is stored or loaded
- **THEN** only the persistence mapper converts between `Money` and the Prisma decimal representation

### Requirement: External representations are mapped at boundaries
The system SHALL keep Prisma records, API DTOs, parser inputs, form values, export rows, and domain objects as separate representations connected by explicit mappings.

#### Scenario: Prisma data is loaded into the domain
- **WHEN** a persisted voucher is read
- **THEN** Prisma-specific values are converted before a concrete domain voucher is returned

#### Scenario: Form or parser data creates a voucher
- **WHEN** validated form or parser input is submitted
- **THEN** it is converted into a domain input before the concrete voucher is created

#### Scenario: Domain data is returned by an API
- **WHEN** a service returns a concrete voucher
- **THEN** the response is produced from a DTO mapping and does not expose Prisma types

### Requirement: New creation and historical rehydration are distinct
The system SHALL apply strict current invariants when creating or modifying vouchers and SHALL remain able to rehydrate compatible historical records without silently discarding their data.

#### Scenario: New voucher violates a current invariant
- **WHEN** a new voucher input violates its type-specific invariant
- **THEN** creation fails before persistence

#### Scenario: Historical record contains a legacy nullable value
- **WHEN** a known voucher type is loaded from an existing record with a historically tolerated value
- **THEN** the record is rehydrated without data loss and remains readable

### Requirement: Typed domain errors map consistently to API responses
The system SHALL expose typed application errors that routes map consistently to Spanish user-facing responses and appropriate HTTP statuses.

#### Scenario: Validation error is returned
- **WHEN** a request or domain operation fails validation
- **THEN** the API returns status `400` with a concise Spanish message

#### Scenario: Authentication or authorization error is returned
- **WHEN** a request lacks valid authentication or company context
- **THEN** the API returns `401` without an authenticated session, `403` when the authenticated user cannot access the requested company, or `400` when no active company is provided and no unique company can be inferred, always with a concise Spanish message

#### Scenario: Resource is not found
- **WHEN** a requested voucher or related resource does not exist in the company context
- **THEN** the API returns status `404` with a concise Spanish message

#### Scenario: Duplicate voucher is detected
- **WHEN** a duplicate operation is rejected
- **THEN** the API returns a conflict response without exposing internal error details

#### Scenario: Unexpected failure occurs
- **WHEN** an unhandled infrastructure or application failure occurs
- **THEN** the API returns a generic Spanish error response and records an English diagnostic log with safe context
