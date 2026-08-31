## Why

The current frontend eagerly mounts heavy modal trees, fetches data for routes and detail views before the user needs them, and revalidates broad SWR scopes after mutations. That increases bundle size, duplicates requests, and makes loading states feel heavier than necessary across the authenticated product.

## What Changes

- Add a cross-cutting frontend performance pass for the current authenticated routes and shared modal flows, focused on lazy loading, dynamic imports, and request reduction.
- Defer modal, preview, and other non-critical client bundles until the user actually opens or needs them.
- Prevent hidden CRUD/detail flows from mounting or fetching data while closed.
- Tighten SWR usage so route data, detail data, and post-mutation revalidation only refresh the minimum necessary scope.
- Enforce a route-scoped data-loading rule so no authenticated screen requests data from another module unless that data is required by the route's current visible state.
- Centralize authenticated user and company loading so navigation does not trigger redundant identity-related requests.
- Introduce an explicit user-session DTO so the client only consumes the auth fields the application actually needs.
- Remove raw auth-session payload exposure from internal client contracts so tokens are not propagated through application-level responses or hooks.
- Move the login and logout application flow behind server-side route handlers so the browser no longer consumes raw Supabase auth-session payloads through app-owned fetch contracts.
- Preserve current server-side table behavior while reducing redundant client-side refetches.
- Keep the implementation compatible with the current App Router architecture without forcing a full migration to Cache Components in this change.
- Keep the current UI structure, copy, and interaction design unchanged unless a performance fix proves impossible without a visible adjustment that the user explicitly approves first.

## Capabilities

### New Capabilities
- `frontend-performance`: Defines how authenticated routes and shared modal flows must defer non-critical UI, fetch data on demand, and avoid unnecessary revalidation.

### Modified Capabilities
- `auth-ui`: Adds shared authenticated user loading and a constrained DTO contract for client-side session consumption.

## Impact

- Affects the current authenticated route set and the shared modal/dialog flows reused by vouchers, clients, suppliers, conciliations, analytics, and dashboard screens.
- Affects hook composition, SWR key usage, and mutation invalidation helpers so data is fetched only when the corresponding UI is active.
- Affects route data ownership so each authenticated screen loads only its own visible module data instead of triggering unrelated cross-route or cross-module requests.
- Affects auth and company context composition so user identity and company membership are cached once and reused across route navigation.
- Affects modal loading behavior so detail requests no longer happen while the related dialog is closed.
- Affects the shape of user data consumed by client code so Supabase user objects are normalized into an application DTO instead of exposing the raw payload everywhere.
- Affects auth hook and login contracts so application consumers no longer receive raw session/token payloads.
- Affects the login and logout transport so authentication requests flow through application-owned server endpoints instead of direct browser-side auth calls.
- Requires Jest coverage for deferred rendering, conditional fetching, and the new request invalidation behavior.
