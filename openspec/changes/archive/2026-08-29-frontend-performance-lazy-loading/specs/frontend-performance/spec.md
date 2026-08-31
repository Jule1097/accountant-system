## ADDED Requirements

### Requirement: No UI Behavior Or Visual Redesign Within This Change
The system MUST keep the current user-facing UI structure, labels, styling, and interaction design unchanged during this optimization effort unless a required visible exception is explicitly approved by the user before implementation.

#### Scenario: Optimization can be implemented without visible UI change
- **WHEN** a performance, caching, or request optimization is implemented
- **THEN** the existing user-facing UI behavior and visual structure MUST remain unchanged

#### Scenario: Optimization appears to require a visible UI adjustment
- **WHEN** implementation reveals that a performance fix cannot be completed without changing visible UI behavior or presentation
- **THEN** the work MUST pause for explicit user validation before that UI change is applied

#### Scenario: Dashboard loading pilot applies its allowed visual exception
- **WHEN** the dashboard loading state is implemented through the Boneyard pilot in this change
- **THEN** that loading placeholder MAY change as the single approved visual exception within this initiative
- **AND** no other route or interaction flow MAY change visible UI without explicit user approval

### Requirement: Deferred Client Bundles On Authenticated Routes
The system MUST defer non-critical Client Components on the current authenticated routes so users only download and hydrate heavy interaction-driven UI when it becomes necessary.

#### Scenario: User opens an authenticated route
- **WHEN** the user navigates to a current authenticated application route
- **THEN** the initial route render MUST prioritize only the UI required for the visible screen state
- **AND** heavy client-only subtrees that are not required for first paint MUST be lazy loaded

#### Scenario: Route contains optional interaction surfaces
- **WHEN** a route includes modals, previews, drawers, or similar UI that is closed by default
- **THEN** those client bundles MUST not be loaded eagerly only because the route mounted

### Requirement: Route-Scoped Data Loading
The system MUST keep authenticated route requests scoped to the data required by the route's current visible state and MUST avoid cross-route or cross-module fetches.

#### Scenario: User opens an authenticated route
- **WHEN** the user navigates to a route inside the authenticated application
- **THEN** the route MUST request only the data required by its current visible UI state
- **AND** it MUST not request unrelated module data just because shared hooks or providers are mounted elsewhere

#### Scenario: Route does not display another module
- **WHEN** a screen does not show a secondary module in its initial visible state
- **THEN** the system MUST not issue that module's requests during the route load

#### Scenario: User returns to a previously visited route
- **WHEN** the user re-enters an authenticated route and its cached route data is still valid
- **THEN** the system MAY reuse that cached route data
- **AND** it MUST only revalidate according to the configured freshness strategy for that specific resource

### Requirement: Uniform Route Entry Loading Contract
The system MUST implement a single route-entry loading pattern across the authenticated dashboard pages so loading ownership is consistent and testable.

#### Scenario: Authenticated dashboard route initializes
- **WHEN** the user navigates to a page inside the authenticated dashboard route group
- **THEN** the route `page.tsx` MUST remain a mount-only entry
- **AND** the route's primary loading state MUST be owned by a top-level `Suspense` boundary declared in that `page.tsx`
- **AND** the fallback MUST reuse the route's approved skeleton component

#### Scenario: View component renders primary route content
- **WHEN** the route view component renders the primary list, metrics, or dashboard surface for that page
- **THEN** it MUST assume the route-level loading boundary already owns the initial loading state
- **AND** it MUST not render a duplicate primary skeleton for the same initial route state from internal `isLoading` checks alone

#### Scenario: Route contains deferred secondary UI
- **WHEN** the route includes modals, drawers, detail panes, optional tabs, or other secondary UI that resolves after the initial route surface
- **THEN** those secondary flows MAY render their own local loading fallback
- **AND** that local fallback MUST remain scoped only to the deferred subsection instead of replacing the route-level loading contract

### Requirement: Shared Authenticated User And Company Sources
The system MUST share authenticated-user and company-membership data through cached application-level client sources instead of refetching them independently from multiple consumers.

#### Scenario: User navigates between authenticated routes
- **WHEN** the authenticated user changes pages inside the application
- **THEN** the system MUST reuse the shared authenticated-user state
- **AND** it MUST avoid issuing redundant user-identity requests only because a new route mounted

#### Scenario: Multiple components need the authenticated user
- **WHEN** sidebar, forms, providers, or other UI consumers need the authenticated user at the same time
- **THEN** the system MUST consume one shared user source instead of performing one `getUser` request per consumer

#### Scenario: Multiple components need company membership
- **WHEN** several authenticated components need the companies available to the current user
- **THEN** the system MUST consume one shared cached company collection
- **AND** changing pages MUST not reload that collection unnecessarily

#### Scenario: Application session starts successfully
- **WHEN** the authenticated application bootstraps after a successful login or hard refresh
- **THEN** the system MUST load the authenticated user source and company membership source once for that session
- **AND** internal route navigation MUST reuse those shared session-scoped sources

#### Scenario: User changes the active company
- **WHEN** the user changes `activeCompanyId`
- **THEN** the system MUST refresh the visible data for the active route and current UI state
- **AND** it MUST avoid eagerly refetching inactive routes only because the active company changed

### Requirement: Inactive UI Paths Must Stay Dormant
The system MUST keep inactive tabs, closed overlays, hidden previews, and unopened optional sections from mounting request hooks or triggering data fetches.

#### Scenario: Route contains inactive tabs
- **WHEN** a route renders more than one tab and only one tab is active
- **THEN** the inactive tabs MUST not mount data-fetching logic
- **AND** they MUST not request their server-side table data until the user selects them

#### Scenario: Route contains optional secondary sections
- **WHEN** a route includes secondary panels, previews, or other optional content that is not visible yet
- **THEN** those sections MUST remain dormant
- **AND** they MUST not request data until the user opens or activates them

### Requirement: Client-Side User DTO Contract
The system MUST expose an application DTO for authenticated user data so client consumers receive only the fields required by the product instead of the raw Supabase user payload.

#### Scenario: Client code consumes the authenticated user
- **WHEN** a client component, hook, or provider reads authenticated-user data
- **THEN** it MUST receive the application DTO shape
- **AND** it MUST not depend on the provider-specific raw Supabase user object directly

#### Scenario: Application needs only a subset of identity data
- **WHEN** the authenticated user payload contains provider-specific fields not used by the product
- **THEN** those fields MUST remain outside the client-facing DTO contract

#### Scenario: Current iteration uses the minimum DTO
- **WHEN** the client consumes the authenticated-user DTO in this iteration
- **THEN** the DTO MUST be limited to `id` and `email`

### Requirement: No Token-Bearing Auth Payloads In App Contracts
The system MUST prevent application-level hooks, providers, and internal client-facing contracts from exposing raw auth-session payloads or token-bearing auth response objects.

#### Scenario: Client login flow resolves successfully
- **WHEN** the login flow completes successfully
- **THEN** application-level consumers MUST not receive `access_token`, `refresh_token`, expiration metadata, or the raw Supabase session payload through the app contract

#### Scenario: App-owned auth request is sent from the browser
- **WHEN** the browser submits an application-owned login or logout request
- **THEN** that request MUST resolve through a server-side route handler owned by the application
- **AND** the response contract MUST remain free of raw token-bearing session fields

#### Scenario: Authenticated UI reads shared auth state
- **WHEN** a client component or hook consumes authenticated-user information from the shared app source
- **THEN** it MUST receive only the application DTO contract
- **AND** it MUST not receive token-bearing session fields

### Requirement: Closed Overlays Must Not Mount
The system MUST avoid mounting closed overlays so hidden UI does not keep unnecessary component trees, effects, or request hooks alive.

#### Scenario: CRUD overlay is closed
- **WHEN** a modal or dialog used for create, edit, view, delete, or preview is closed
- **THEN** the corresponding overlay subtree MUST not remain mounted in the DOM

#### Scenario: User opens an overlay
- **WHEN** the user opens a create, edit, view, delete, or preview overlay
- **THEN** the system MUST load and render that subtree on demand
- **AND** it MUST show the corresponding loading fallback if the component bundle or its dependent data is still resolving

### Requirement: UI-State-Driven Detail Fetching
The system MUST fetch detail records only when the relevant UI path is active and the exact record identifier is present.

#### Scenario: User remains on a list screen
- **WHEN** the user is viewing a table or summary route without an open detail-oriented overlay
- **THEN** the system MUST not request record detail data for dormant create, edit, view, or preview flows

#### Scenario: User opens an edit or detail flow
- **WHEN** the user opens an edit, detail, or preview overlay for a specific record
- **THEN** the system MUST activate the corresponding detail fetch for that record
- **AND** the request MUST be scoped to the opened UI state only

### Requirement: Targeted SWR Revalidation
The system MUST revalidate only the minimum safe SWR cache scope required after a mutation.

#### Scenario: User mutates table data
- **WHEN** the user creates, updates, or deletes a record from a route with list data
- **THEN** the system MUST refresh the affected list cache
- **AND** it MUST avoid refetching unrelated route caches that were not changed by that mutation

#### Scenario: Mutation affects a summary and a list
- **WHEN** a mutation changes both visible summary data and visible list data on the same route
- **THEN** the system MUST refresh those affected caches
- **AND** it MUST avoid broad prefix-based revalidation of inactive or unrelated screens when a narrower invalidation path is sufficient

#### Scenario: Authenticated route navigation occurs without auth changes
- **WHEN** the user navigates between authenticated routes and no login, logout, or session-state change occurred
- **THEN** the system MUST reuse the shared authenticated-user source
- **AND** it MUST not refetch the authenticated user only because of navigation

### Requirement: Polling Must Be Explicitly Scoped
The system MUST restrict automatic polling to the resources that truly require it and MUST not treat polling as the default refresh mechanism for authenticated routes.

#### Scenario: Notifications need periodic refresh
- **WHEN** the notifications flow is active in the authenticated application
- **THEN** the system MAY poll that resource at the configured interval to keep alerts current

#### Scenario: Standard authenticated route data is visible
- **WHEN** the user is viewing vouchers, analytics, clients, suppliers, conciliations, dashboard, or other non-notification route data
- **THEN** the system MUST not poll those resources by default
- **AND** it MUST refresh them through mutation, focus, explicit user refresh, or `activeCompanyId` change when applicable

### Requirement: Preserve Existing Server-Driven Table Contracts
The system MUST keep the existing server-side pagination, sorting, search, totals, and filter contracts intact while optimizing client-side request behavior.

#### Scenario: User changes page, sort, or filters
- **WHEN** the user interacts with a server-driven table control
- **THEN** the system MUST continue requesting the corresponding server-side page and filter state
- **AND** it MUST not trigger duplicate refreshes for stale inactive UI paths
