## Purpose

Establishes a maintainable third-party domain foundation so clients and suppliers share consistent behavior while remaining separate commercial roles and future roles can be added without duplicating application logic.

## ADDED Requirements

### Requirement: Shared third-party identity behavior

The client and supplier domain entities MUST expose consistent identity behavior for company ownership, name, CUIT, normalization, and comparison. Each entity MUST reject invalid intrinsic state and MUST apply the existing name and CUIT normalization rules consistently for both roles.

#### Scenario: Equivalent names are compared consistently
- **WHEN** a client or supplier is compared with another record using names that differ only by surrounding whitespace or letter casing
- **THEN** the comparison MUST treat the names as equivalent under the existing normalization rules

#### Scenario: Equivalent CUIT formats are compared consistently
- **WHEN** a client or supplier is compared with a CUIT represented with or without formatting separators
- **THEN** the comparison MUST use the existing CUIT normalization behavior for both roles

#### Scenario: Invalid intrinsic state is rejected
- **WHEN** a domain entity is constructed or asked to change to an empty name or invalid CUIT
- **THEN** the operation MUST fail before persistence and MUST not leave the entity in an invalid state

### Requirement: Role-specific domain separation

Clients and suppliers MUST remain distinct domain roles even when they share common identity behavior. A record MUST retain its role when it is created, read, updated, selected for a voucher, or deleted.

#### Scenario: Same legal entity can have two roles
- **WHEN** the same company registers one client and one supplier with the same CUIT
- **THEN** the system MUST preserve them as separate role-specific records according to the current business rules

### Requirement: Domain behavior remains persistence-independent

Third-party domain behavior MUST be executable without database access, HTTP requests, React state, toast managers, or Prisma delegates. Persistence-dependent rules MUST continue to be enforced by the application and infrastructure layers.

#### Scenario: Domain state change is validated without infrastructure
- **WHEN** an application service asks a third-party entity to change its name or CUIT
- **THEN** the entity MUST validate and normalize its own state without querying a repository

#### Scenario: Voucher dependency blocks deletion
- **WHEN** an application requests deletion of a client or supplier referenced by a voucher
- **THEN** the application layer MUST reject the deletion and preserve the existing Spanish error behavior

### Requirement: Persistence and API boundaries remain explicit

Domain models MUST be separated from Prisma records and public API DTOs by explicit mapping boundaries. Domain models MUST NOT import Prisma-generated types, and UI or API consumers MUST NOT require Prisma-generated types to represent third-party data.

#### Scenario: Persistence record is mapped to the domain
- **WHEN** a repository returns a client or supplier persistence record
- **THEN** a mapping boundary MUST be able to construct the corresponding domain model without exposing the persistence type to the model

#### Scenario: Domain model is returned through an existing API
- **WHEN** an endpoint returns a client or supplier after a domain operation
- **THEN** the response MUST be serialized through an API-compatible DTO and preserve the existing JSON shape

### Requirement: Existing client-supplier contracts remain compatible

The refactoring MUST preserve the existing REST endpoint paths, request and response contracts, company-scoped behavior, duplicate rules, inline voucher creation flow, and user-facing Spanish messages.

#### Scenario: Existing client CRUD continues to work
- **WHEN** an authenticated consumer performs the current client list, create, read, update, or delete operation
- **THEN** the operation MUST retain its current result shape, status behavior, and company isolation

#### Scenario: Existing supplier CRUD continues to work
- **WHEN** an authenticated consumer performs the current supplier list, create, read, update, or delete operation
- **THEN** the operation MUST retain its current result shape, status behavior, and company isolation

### Requirement: Generic resource responsibilities remain separated

Shared resource hooks MUST keep data loading, optional URL query state, mutations, pagination transitions, and async feedback state as independently testable responsibilities for any compatible resource. Generic contracts MUST be defined in a shared types folder, MUST receive resource operations through adapters or injected functions, and MUST NOT depend on a concrete domain, modal implementation, form schema, toast manager, or domain message.

#### Scenario: Resource deletion coordinates independent outcomes
- **WHEN** a consumer confirms deletion of a compatible resource
- **THEN** request execution, UI transition, list refresh, pagination adjustment, and feedback behavior MUST be independently replaceable and testable

#### Scenario: Mutation fails
- **WHEN** the delete request fails because of a domain or API constraint
- **THEN** the modal state MUST remain recoverable, the list MUST not be refreshed as if deletion succeeded, and the user MUST receive the existing Spanish error feedback

#### Scenario: Resource has no optional operation
- **WHEN** a compatible resource does not support detail loading or deletion
- **THEN** the shared hooks MUST allow that operation to be omitted without requiring a fake implementation

### Requirement: Reuse-first architectural evolution

The implementation MUST audit existing methods, components, hooks, helpers, types, interfaces, services, repositories, tests, imports, and exports before introducing replacements. New artifacts MUST be created only when no suitable existing artifact can be adapted, and replaced artifacts MUST be removed once all consumers have migrated.

#### Scenario: Existing artifact can be adapted
- **WHEN** an existing artifact provides compatible behavior for a new shared responsibility
- **THEN** the implementation MUST adapt or generalize that artifact instead of creating a parallel duplicate

#### Scenario: Artifact is no longer consumed
- **WHEN** all consumers have migrated from an obsolete artifact
- **THEN** the obsolete artifact, references, and unused exports MUST be removed

### Requirement: Justified design principles

The implementation MUST apply SOLID and related design principles when they demonstrably reduce coupling, duplication, responsibility overlap, or the cost of adding a new resource. The implementation MUST NOT introduce abstractions solely to satisfy a named principle.

#### Scenario: Abstraction reduces repeated behavior
- **WHEN** two or more resources have identical behavior and a shared contract preserves their differences safely
- **THEN** the implementation MUST prefer the shared contract or abstraction over duplicated logic

#### Scenario: Abstraction increases complexity without reuse
- **WHEN** a proposed abstraction has no stable shared behavior or would hide meaningful resource differences
- **THEN** the implementation MUST keep the implementation concrete and document why the abstraction was not introduced

### Requirement: Affected consumers remain aligned

All consumers of the refactored models, repository contracts, service entry points, and resource adapters MUST be migrated or verified for compatibility before the change is complete. Consumers outside the direct scope MUST remain unchanged unless required to preserve their existing behavior.

#### Scenario: A consumer uses a refactored contract
- **WHEN** a parser, voucher, API, UI, or test consumer depends on a changed internal contract
- **THEN** that consumer MUST use the new boundary or an explicit compatibility adapter while preserving its observable behavior

#### Scenario: Unrelated module is not affected
- **WHEN** a module has no dependency on the refactored contracts or behavior
- **THEN** the implementation MUST NOT modify it as part of this change

### Requirement: Architectural cleanliness is verified

The completed change MUST contain no obsolete imports, unused exports, dead replacement artifacts, inline reusable types outside the appropriate types folders, known duplicated implementations, or forbidden dependency direction from domain and generic resource layers.

#### Scenario: Architectural audit passes
- **WHEN** the change is ready for completion
- **THEN** static searches, type checks, lint, and focused tests MUST confirm the implementation follows the defined layer and artifact boundaries

### Requirement: Magic values are centralized

Production artifacts MUST NOT embed magic strings or magic numbers for domain values, configuration, protocol values, statuses, operation errors, or user-facing messages. They MUST reuse existing constants or add responsibility-scoped constants under `src/lib/constants/`. Test literals MAY remain when they explicitly assert the behavior under test.

#### Scenario: New production behavior needs a repeated value
- **WHEN** an implementation introduces a repeated, domain, configuration, protocol, status, or message value
- **THEN** the value MUST be defined or reused as a responsibility-scoped constant before production code consumes it

#### Scenario: Migration cleanup is complete
- **WHEN** all affected consumers have been migrated
- **THEN** searches and tests MUST confirm that obsolete symbols and duplicate implementations are no longer reachable
