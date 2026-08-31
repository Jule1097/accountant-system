## 1. OpenSpec Alignment

- [x] 1.1 Add the `frontend-performance` capability spec covering lazy loading, conditional overlay mounting, targeted SWR fetching, and request invalidation rules
- [x] 1.2 Keep the dashboard loading behavior aligned with the existing skeleton approach while preserving the no-UI-change scope
- [x] 1.3 Keep the change scope restricted to performance and data-flow improvements, escalating any required visible UI change for explicit approval before implementation

## 2. Route And Bundle Optimization

- [x] 2.1 Audit the current authenticated routes and identify which client components must remain eager versus which ones should move behind `next/dynamic`
- [x] 2.2 Refactor route-level mounts so every authenticated dashboard page keeps `page.tsx` as the mount-only entry, owns primary loading through route-level `Suspense`, and loads non-critical client bundles only when their screen section or interaction path is needed
- [x] 2.3 Preserve existing Suspense and loading behavior while replacing eager imports where they create unnecessary initial bundle cost, and remove duplicate primary route skeleton ownership from `dashboard`, `analytics`, `clients`, and `suppliers` view components
- [x] 2.4 Audit all authenticated routes for cross-route or cross-module requests and remove any fetch that is not required by the route's current visible state
- [x] 2.5 Ensure inactive tabs, closed secondary panels, and route-local optional sections do not mount hooks or trigger requests until the user activates them

## 3. Shared Auth And Company Caching

- [x] 3.1 Centralize authenticated user loading so internal navigation does not trigger repeated `getUser` requests from multiple consumers
- [x] 3.2 Add an application DTO for client-side authenticated user data, limited in this iteration to `id` and `email`, and stop exposing the raw Supabase user payload directly across the UI
- [x] 3.3 Stop returning raw auth-session payloads or token-bearing auth response objects from application hooks and providers
- [x] 3.4 Refactor company membership loading into one shared cached source while keeping `activeCompanyId` as persisted local selection
- [x] 3.5 Refresh the visible route data when `activeCompanyId` changes without eagerly reloading inactive routes
- [x] 3.6 Restrict authenticated-user refreshes to initial app load, hard refresh, and real auth-state changes
- [x] 3.7 Move login and logout to application-owned server-side route handlers so browser-side app contracts no longer expose raw Supabase auth-session payloads
- [x] 3.8 Refactor the shared auth client flow to consume the server-side login/logout transport while preserving the constrained authenticated-user DTO contract

## 4. Modal And Overlay Deferral

- [x] 4.1 Refactor shared CRUD/detail modal flows so closed overlays are not mounted
- [x] 4.2 Dynamically import modal-heavy content and previews that are only needed after explicit user interaction
- [x] 4.3 Add modal-local loading states using existing reusable loader patterns where deferred content needs a visual fallback

## 5. SWR Request Reduction

- [x] 5.1 Audit current SWR hooks and company-scoped cache helpers to identify duplicate requests and overly broad invalidation
- [x] 5.2 Update list, summary, and detail hooks so fetches only activate when the corresponding UI state and identifiers are present
- [x] 5.3 Replace broad mutation refreshes with the smallest safe invalidation scope per flow
- [x] 5.4 Preserve server-side pagination, search, sort, and filter behavior while preventing unnecessary refetches for inactive UI

## 6. Verification

- [x] 6.1 Add or update Jest coverage for shared authenticated-user loading, DTO mapping, and company caching behavior
- [x] 6.2 Add or update Jest coverage for deferred modal rendering and conditional detail fetching
- [x] 6.3 Add or update Jest coverage for targeted SWR invalidation and duplicate-request prevention in critical hooks
- [x] 6.4 Verify that internal authenticated navigation reuses the shared user source and does not reload the company collection unnecessarily
- [x] 6.5 Verify that changing `activeCompanyId` refreshes only the visible route data
- [x] 6.6 Verify across the authenticated route set that each screen requests only its own visible module data, does not trigger unrelated cross-route fetches, and keeps primary loading ownership in the route entry instead of the main view component
- [x] 6.7 Add or update Jest coverage for the server-side login/logout transport, including the absence of token-bearing fields in app-facing auth responses
- [x] 6.8 Add or update Jest coverage for inactive tabs and optional route sections so hidden UI paths do not fetch until activated, and add route-level tests for `dashboard`, `analytics`, `clients`, and `suppliers` that assert the shared `page.tsx + Suspense + fallback` contract
- [x] 6.9 Run the relevant Jest suites for auth, dashboard, vouchers, clients-suppliers, conciliations, analytics, and shared hook helpers after the route-entry loading alignment is complete
