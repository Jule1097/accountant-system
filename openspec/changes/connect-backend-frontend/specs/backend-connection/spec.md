## Purpose

Integrates custom hooks and an API fetcher that maps backend JSON responses to rich domain model instances while leveraging React Suspense for loading states.

## ADDED Requirements

### Requirement: Unified API Fetch Wrapper
The system SHALL provide a client-side API client wrapper that automatically reads the active company ID from local storage and appends it to the `x-company-id` header in all requests.

#### Scenario: Request contains company id header
- **WHEN** the client makes a request using the fetch wrapper and an active company ID is set in local storage
- **THEN** the request headers contain the `x-company-id` header with the correct ID.

### Requirement: Client-Side React Suspense Data Loading
The system SHALL use custom hooks (`useVouchers`, `useAnalytics`, `useCompany`) that return fetch promises resolved via React's `use` API to delegate loading states to parent `<Suspense>` boundaries.

#### Scenario: Component suspends during data fetch
- **WHEN** a component renders and data is fetching
- **THEN** the component suspends and displays the nearest `<Suspense>` fallback UI until the promise resolves.

### Requirement: Rich Client-Side Domain Model Mapping
The system SHALL parse JSON payloads returned from backend endpoints and instantiate rich `Voucher` model class instances to execute calculation and status derivation logic on the client.

#### Scenario: Instantiate Voucher models on retrieve
- **WHEN** vouchers are retrieved from `/api/vouchers`
- **THEN** the array elements are mapped to instances of `Voucher`
- **AND** UI cells can access calculated properties (e.g. `netAmount`, `status`) resolved by model methods.
