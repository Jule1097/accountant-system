## Context

The current application already uses App Router route boundaries and a few Suspense fallbacks, but several important screens remain fully client-driven and eagerly mount interactive subtrees. The dashboard page fetches analytics and two voucher collections immediately on mount. Voucher and client-supplier management views mount create, detail, and delete modal components unconditionally, which keeps those bundles and some related detail-fetch logic alive even when no modal is open. SWR invalidation is also broader than necessary in some flows because helper methods revalidate full path prefixes instead of the exact route data affected by a mutation.

The current authenticated identity flow also performs redundant work. `useAuth()` issues `supabase.auth.getUser()` from inside the hook itself, so each consumer can trigger its own user lookup instead of sharing one cached session source. The current login path also performs browser-side Supabase authentication, which means the auth response visible to the browser contains token-bearing session data even though the product UI only needs a constrained authenticated-user contract. `CompanyProvider` then fetches `/api/companies` with duplicated logic between initial load and refresh behavior. The product already has reusable manual skeleton components and an existing pattern for shared table experiences.

## Goals / Non-Goals

**Goals:**
- Reduce initial client bundle cost on current authenticated routes by deferring non-critical client components.
- Ensure each authenticated route requests only the data needed for its current visible state and never eagerly loads unrelated module data.
- Ensure closed modals, drawers, previews, and detail views do not mount or fetch until they are opened.
- Reduce duplicate or overly broad SWR requests and revalidations while preserving correctness after mutations.
- Avoid redundant authenticated-user and company requests across internal navigation.
- Limit client-side session payloads to an application DTO instead of exposing the full Supabase user object everywhere.
- Stop propagating raw auth-session payloads and tokens through application-level hooks or responses.
- Move login/logout to server-side application endpoints so auth fetches owned by the app do not expose raw session payloads in their response contracts.
- Keep route behavior and business rules unchanged from the user perspective.
- Keep the solution reusable and aligned with the existing domain-based architecture.

**Non-Goals:**
- Rewrite the product from client-driven SWR flows to server-first data fetching in this change beyond the scoped login/logout transport hardening.
- Enable `cacheComponents` globally as part of this iteration.
- Redesign current screens, alter UI copy, or change interaction behavior unless a required visible adjustment is explicitly approved by the user first.
- Introduce new backend endpoints only for performance experimentation unless an existing contract blocks the optimization.
- Redesign authentication or authorization business rules.

## Decisions

### 1. Scope the optimization to the current authenticated application surface plus the minimal auth transport required to secure it
- **Decision:** This change targets the routes and shared flows currently used inside the authenticated dashboard area, including dashboard, analytics, sales, purchases, clients, suppliers, conciliations, their shared modal/dialog flows, and the minimal login/logout route-handler transport needed to stop exposing token-bearing auth payloads through app-owned browser contracts.
- **Rationale:** The authenticated product is the main performance surface, and the login transport change is the smallest auth adjustment that directly addresses the current token-exposure concern without redesigning business rules.
- **Alternative:** Leaving login outside the iteration would preserve a known security weakness in the app-facing auth flow, while attempting a full auth architecture rewrite would expand the scope too far.

### 2. Use `next/dynamic` for non-critical client subtrees
- **Decision:** Heavy client components such as modal content, detail views, previews, and other interaction-only surfaces must be loaded through `next/dynamic` when they are not required for the initial visible route content.
- **Rationale:** Next.js lazy loading is explicitly intended for deferring Client Components and modal-style UI until the user needs them.
- **Alternative:** Leaving static imports in place would keep the initial bundle and hydration cost unnecessarily high.

### 3. Closed overlays must not mount
- **Decision:** Modals, dialogs, and equivalent overlays must be conditionally rendered only when open state requires them, instead of remaining mounted with hidden state.
- **Rationale:** Dynamic imports only deliver real savings if the subtree is not rendered before it is needed.
- **Alternative:** Keeping closed overlays mounted would still execute hook setup, retain memory, and sometimes trigger dependent fetch logic.

### 4. Detail queries must be activated by UI state, not by route presence alone
- **Decision:** SWR detail fetches must only run when the exact record id exists and the corresponding detail/edit UI is actually open.
- **Rationale:** Record detail data is not route-critical for the initial list render and should not be loaded speculatively while the user remains in the table view.
- **Alternative:** Fetching detail data every time a management page mounts or when a dormant query state exists wastes requests.

### 5. Revalidation must move from broad scope refreshes to targeted invalidation
- **Decision:** Mutations must invalidate the smallest safe set of SWR keys instead of refreshing whole path-prefix scopes by default.
- **Rationale:** Broad invalidation creates duplicate traffic and can refetch data for routes or summaries that the user is not currently interacting with.
- **Alternative:** Full scope revalidation is simpler to wire but scales poorly as more screens share the same company-scoped cache.

### 5.b. Route ownership must prevent cross-route and cross-module requests
- **Decision:** Each authenticated route may request only the data required for its current visible UI state; it must not preload or refetch unrelated module data just because another hook is mounted higher in the tree.
- **Rationale:** Requesting data for other modules increases network traffic, makes loading harder to reason about, and weakens the route/component responsibility boundaries.
- **Alternative:** Allowing shared high-level hooks to fetch opportunistically would keep hidden request coupling alive and make performance regressions hard to detect.

### 6. Keep cacheComponents as a future evaluation, not a rollout dependency
- **Decision:** This change will not require enabling `cacheComponents` globally. The design will document where it may become valuable later, especially if route data moves server-side.
- **Rationale:** The current app is still heavily based on Client Components plus SWR, so the first reliable performance gains come from deferring client bundles and tightening request orchestration.
- **Alternative:** Enabling `cacheComponents` now would add migration and state-preservation complexity without addressing the main current bottlenecks directly.

### 7. Share authenticated user state through one cached client source
- **Decision:** Authenticated user/session data must be loaded once and shared through a single client-side source instead of calling `supabase.auth.getUser()` independently from multiple hooks and components.
- **Rationale:** Identity data is global application state and should not refetch on every consumer mount or route navigation.
- **Alternative:** Leaving `useAuth()` as a self-fetching hook would preserve repeated requests and inconsistent loading behavior.

### 8. Use an application DTO for client-side user identity
- **Decision:** The client must consume a dedicated application DTO derived from Supabase auth data instead of passing the raw Supabase user object through the UI tree. In this iteration, that DTO is restricted to `id` and `email`.
- **Rationale:** The app only needs a constrained subset of fields, and an explicit DTO reduces accidental coupling to provider-specific payload shape while avoiding unnecessary data exposure.
- **Alternative:** Continuing to expose the raw Supabase `User` object would keep the client contract wider than necessary.

### 9. Do not propagate raw auth-session payloads through app contracts
- **Decision:** Application-level hooks, providers, and internal responses must not expose raw Supabase auth-session payloads such as `access_token`, `refresh_token`, expiration metadata, or the full `AuthResponse['data']` object to UI consumers.
- **Rationale:** Even if the browser receives session data as part of a client-side auth flow, the app should not widen that exposure by propagating token-bearing payloads through its own contracts.
- **Alternative:** Returning raw auth-session data from app-level hooks would preserve unnecessary coupling and broaden accidental token exposure.

### 10. Cache company membership separately from active selection
- **Decision:** The list of companies available to the authenticated user must come from a shared cached client source, while `activeCompanyId` remains a persisted local selection.
- **Rationale:** Company membership is shared low-churn data, whereas the active selection is user-local UI state that should survive reloads.
- **Alternative:** Storing the full company list in local storage would create manual invalidation problems and stale state risk.

### 11. Move app-owned login/logout transport to server-side route handlers
- **Decision:** The login and logout interactions owned by the application must execute through server-side Route Handlers instead of returning raw Supabase auth responses directly to browser-side application code.
- **Rationale:** This keeps token-bearing provider payloads out of app-owned fetch contracts while aligning the auth transport with the existing server-side session refresh path.
- **Alternative:** Keeping browser-side direct auth calls would continue exposing `access_token`, `refresh_token`, and raw session metadata in network responses that the application itself can avoid returning.

### 12. Keep the authenticated client contract limited to a DTO even after server-side login
- **Decision:** After the login transport moves server-side, client code must still consume only the constrained authenticated-user DTO and never the raw provider session shape.
- **Rationale:** Server-side login reduces network exposure from app-owned contracts, but the client contract also needs an explicit boundary to prevent future regressions.
- **Alternative:** Returning a sanitized-but-still-provider-shaped payload would keep the client coupled to Supabase auth internals unnecessarily.

### 13. Reuse-first remains mandatory during optimization
- **Decision:** Existing loaders, table shells, query helpers, modal patterns, and SWR utilities must be audited before creating new abstractions, and any new helper introduced by this change must be reusable across domains.
- **Rationale:** Performance work often creates one-off wrappers unless reuse boundaries are enforced intentionally.
- **Alternative:** Feature-specific optimization helpers would solve the local problem while making the architecture noisier.

### 14. UI must remain unchanged unless the user approves a visible exception
- **Decision:** This change is restricted to performance, loading, caching, and data-flow improvements. Existing UI structure, labels, styling, and interaction patterns must remain unchanged unless a required visible adjustment is surfaced to the user and approved before implementation.
- **Rationale:** The goal of this initiative is technical optimization, not product or visual redesign.
- **Alternative:** Allowing incidental UI changes during performance work would make review harder and blur the acceptance criteria of the change.

## Design Details

### Route-level loading strategy

- Keep route `page.tsx` files as mount points only.
- Standardize every authenticated dashboard page on the same route-entry contract: `page.tsx` owns the primary `Suspense` boundary and reuses the route-approved skeleton fallback.
- Treat the current `sales`, `purchases`, and `conciliations` pages as the reference pattern to converge on across `dashboard`, `analytics`, `clients`, and `suppliers`.
- Move heavy client-only sections behind dynamic imports when they are not needed for first paint.
- Ensure each route requests only the data needed by its initial visible screen state and does not trigger requests for other modules.
- Prefer route-local fallback reuse from existing skeleton components.
- Keep primary route loading out of the view component itself; internal `isLoading` checks may still gate deferred secondary subsections, but they must not duplicate the route's initial loading skeleton for the main screen.
- Do not change visible route UI as part of these refactors unless a blocking technical constraint is first validated by the user.

### Modal and overlay strategy

- Replace unconditional modal mounting with conditional rendering based on open state.
- Dynamically import modal-heavy client components at the module top level and render them only when the relevant open flag is true.
- Pass already-prepared data and callbacks into presentation components instead of pushing fetch or invalidation logic down into modal UI.
- Add loading placeholders inside modal flows only while the modal content or detail payload is actually being resolved.
- Preserve the current modal UX and visual composition unless a visible exception is explicitly approved.

### SWR request strategy

- Build SWR keys only when the active company context and the exact UI state require the request.
- Prevent route-level hooks or shared providers from requesting data for inactive routes or unrelated modules.
- Split list, summary, and detail invalidation so a mutation refreshes only the affected caches.
- Avoid re-fetching inactive tabs, hidden modal detail records, or unrelated summaries after create/update/delete operations.
- Preserve server-side pagination, sorting, and filtering contracts while avoiding duplicate client refreshes for unchanged query state.
- When `activeCompanyId` changes, refresh the visible data for the active route and current UI state without eagerly refetching inactive routes.
- Keep cache segmentation keyed by company so already-visited company-specific data can remain isolated safely in memory.

### Cache ownership strategy

- Treat authenticated user identity and company membership as session-scoped cached data that loads once per authenticated app boot and is reused through navigation.
- Treat business data such as vouchers, analytics, clients, suppliers, and conciliations as company-scoped route data that must invalidate only when `activeCompanyId` changes or when a relevant mutation occurs.
- Reuse recent cache on route re-entry when it is still valid, then revalidate only when the configured strategy for that resource requires it.
- Keep polling restricted to `notifications`; all other resources should refresh through mutation, focus, explicit refresh, or company-context change only.

### Auth and company shared-state strategy

- Replace per-consumer user loading with one shared authenticated-user source at the application level.
- Normalize Supabase auth data into an application DTO before exposing it to client consumers, limited in this iteration to `id` and `email`.
- Ensure application hooks and providers do not return token-bearing auth-session payloads to client consumers.
- Move login and logout to application-owned Route Handlers that use the server-side Supabase client and return only minimal success or failure contracts.
- Keep login responses non-cacheable and free of raw token, refresh, expiry, or provider session fields.
- Cache the authenticated user's company list through a shared client query layer instead of manual duplicated fetch logic.
- Keep `activeCompanyId` as local persisted UI state and derive `activeCompany` from the cached company collection plus that selected id.
- Do not re-request authenticated-user data during ordinary internal route navigation.
- Allow the shared authenticated-user source to refresh only on initial application load, hard refresh, or real authentication state changes such as login, logout, or session/token updates.

## Risks / Trade-offs

- **[Risk] Conditional rendering can expose hidden coupling in modal flows** -> Mitigation: cover open/close, create/edit/view, and cached-detail scenarios with tests before production refactors.
- **[Risk] Over-targeted invalidation can leave stale data visible** -> Mitigation: define the exact cache groups per mutation path and add tests around list refresh, detail refresh, and summary refresh behavior.
- **[Risk] Dynamic imports can fragment component boundaries awkwardly if applied too aggressively** -> Mitigation: reserve them for heavy, interaction-driven client subtrees rather than basic presentational atoms.
- **[Risk] Introducing a user DTO can miss a field currently used implicitly by some component** -> Mitigation: audit current user consumers before narrowing the contract and cover the shared auth shape with tests.
- **[Risk] Internal contracts may still leak token-bearing auth data indirectly during refactors** -> Mitigation: explicitly type app-facing auth returns with the DTO and add tests that assert token/session fields are not exposed.
- **[Risk] Server-side login may diverge from the existing session-refresh middleware behavior** -> Mitigation: reuse the current server-side Supabase integration path and cover login/logout plus subsequent authenticated navigation with integration-style tests.
- **[Risk] A performance refactor may appear to require incidental UI tweaks** -> Mitigation: treat any visible UI change as out of scope by default and pause for explicit user validation before implementing it.
- **[Risk] Cache Components may be perceived as missing from the performance plan** -> Mitigation: document explicitly that they are a later-stage fit once more route data moves to server-side rendering.

## Migration Plan

1. Add the OpenSpec artifacts for frontend performance optimization.
2. Audit current authenticated routes, hooks, and modal trees to classify what should remain eager and what should become deferred.
3. Move login/logout transport to application-owned server-side route handlers and keep app-facing auth contracts token-free.
4. Centralize authenticated user loading and company membership caching with an application DTO for client consumption.
5. Refactor route and management screens so closed overlays do not mount and every authenticated dashboard page converges on the shared `page.tsx + Suspense + route skeleton` loading contract before any view-level deferred subsections.
6. Tighten SWR key creation and mutation invalidation to reduce duplicate requests while preserving visible freshness.
7. Add Jest coverage for conditional rendering, deferred fetch activation, targeted invalidation behavior, and the shared auth/company data contract.

## Acceptance Notes

- A single application load MUST not trigger duplicate per-consumer authenticated-user fetches.
- Internal navigation between authenticated routes MUST reuse the shared authenticated-user source.
- Internal navigation between authenticated routes MUST not reload the shared company collection unless an explicit company refresh is triggered.
- Authenticated routes MUST not request data from unrelated modules when that data is not required by the route's current visible state.
- Authenticated dashboard pages MUST resolve their primary loading state through the route entry `page.tsx` `Suspense` boundary and approved route skeleton instead of duplicating that loading ownership inside the main view component.
- Login and logout requests owned by the application MUST execute through server-side route handlers instead of returning raw Supabase auth-session payloads to browser-side application code.
- Internal app-facing auth contracts MUST not expose `access_token`, `refresh_token`, expiration metadata, or the raw Supabase session payload.
- Changing `activeCompanyId` MUST refresh the visible data of the active route without eagerly refetching inactive routes.
- Closed overlays MUST not trigger detail fetches.
- Post-mutation invalidation MUST avoid unrelated cache scopes when a narrower refresh path is sufficient.
