## Why

Currently, the frontend views use static mockup data and simulated flows (such as the login form and voucher creation modals). This change is needed to connect the frontend to the backend REST API endpoints and Supabase database, ensuring the entire application is fully functional, secure, and multi-tenant.

## What Changes

- **Supabase Integration & Route Protection**: Connect the login form to Supabase Auth on the client side, and protect all App Router page routes under the middleware by redirecting unauthenticated users to `/login`.
- **Custom React Hooks**: Create custom reactive hooks (`useAuth`, `useCompany`, `useVouchers`, `useAnalytics`) that wrap client-side fetchers and resolve promises utilizing React Suspense.
- **Rich Domain Model Mapping**: Instantiate the rich `Voucher` model class using the JSON payload received from the API so that business logic can be shared on the frontend.
- **Active Company Selector (Option 1)**: Implement a new GET `/api/companies` endpoint and a blocking modal dialog upon startup if the user has multiple companies and none is stored in `localStorage`.
- **Analytics Aggregation API**: Implement a new backend endpoint `/api/analytics` to aggregate and calculate monthly income/expenses trend and category distribution.

## Capabilities

### New Capabilities
- `analytics-api`: A new `/api/analytics` REST endpoint that aggregates financial data by month and category, enforcing strict company isolation.
- `backend-connection`: Custom hooks and a robust fetch client mapping responses to model instances, with native React Suspense integration using the `use` API.

### Modified Capabilities
- `auth-ui`: Update login submission to authenticate with Supabase, and apply middleware route-level redirect rules.
- `frontend-layout`: Mount the active company selector modal and sidebar switcher.
- `voucher-tables`: Replace mock arrays with actual API calls, bind modals to real catalog fetching, and support AI parsing. Note: actual voucher creation/POST, PUT, and DELETE endpoints are deferred in this stage.

## Impact

- **Security**: Complete route protection at the middleware level.
- **Database**: Retrieval of catalogs, clients, suppliers, and vouchers via Prisma repositories.
- **API**: Addition of the `/api/analytics` route.
- **Frontend**: Transition from static data to Suspense-powered API calls.
