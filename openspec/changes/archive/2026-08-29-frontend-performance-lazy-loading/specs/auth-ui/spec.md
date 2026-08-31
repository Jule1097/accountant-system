## MODIFIED Requirements

### Requirement: Login Form UI
The system SHALL provide a dedicated `/login` page containing a form with fields for email, password, and a submit button labeled "Ingresar".

#### Scenario: User views login page
- **WHEN** user navigates to `/login`
- **THEN** the system displays the login form without the dashboard sidebar layout

### Requirement: Form Validation Support
The system SHALL use robust form management (React Hook Form + Zod) for the login inputs to ensure client-side validation is supported.

#### Scenario: User submits empty form
- **WHEN** user clicks "Ingresar" without filling the fields
- **THEN** the form displays appropriate validation errors

#### Scenario: User successfully logs in
- **WHEN** user clicks "Ingresar" with valid credentials
- **THEN** the system authenticates through an application-owned server-side login endpoint
- **AND** the successful client contract remains limited to the authenticated-user flow required by the app

### Requirement: Server-Side Login And Logout Transport
The system MUST perform the application-owned login and logout flow through server-side endpoints so browser-facing app contracts do not expose raw Supabase session payloads.

#### Scenario: Login request succeeds
- **WHEN** the user submits valid credentials from the login form
- **THEN** the browser MUST call an application-owned server-side login endpoint
- **AND** that endpoint MUST establish the authenticated session without returning `access_token`, `refresh_token`, expiration metadata, or the raw provider session payload in its response body

#### Scenario: Logout request succeeds
- **WHEN** the authenticated user signs out
- **THEN** the browser MUST call an application-owned server-side logout endpoint
- **AND** the application session MUST be cleared without exposing raw provider session data through the app response

### Requirement: Shared Authenticated User Contract
The system MUST expose authenticated-user data to client consumers through one shared application-level source and a constrained DTO contract.

#### Scenario: Authenticated client consumers need the current user
- **WHEN** multiple authenticated components or hooks require the current user information
- **THEN** they MUST reuse one shared client-side auth source
- **AND** internal navigation MUST not trigger one provider-level user fetch per consumer

#### Scenario: Client consumes authenticated-user fields
- **WHEN** the UI reads the current authenticated user
- **THEN** it MUST receive the application DTO shape used by the product
- **AND** it MUST not rely directly on the full raw Supabase auth payload

#### Scenario: Current iteration narrows the client auth contract
- **WHEN** the authenticated-user DTO is exposed to client consumers in this iteration
- **THEN** it MUST include only `id` and `email`

#### Scenario: Navigation occurs without auth-state changes
- **WHEN** the authenticated user navigates internally and no login, logout, or session/token change happened
- **THEN** the shared authenticated-user source MUST be reused
- **AND** the client MUST not perform a new user lookup only because navigation occurred

#### Scenario: Session-scoped bootstrap data is already available
- **WHEN** the authenticated application already resolved its shared session-scoped bootstrap data
- **THEN** client auth consumers MUST continue reusing the shared authenticated-user DTO source
- **AND** they MUST not widen the client contract beyond `id` and `email`
- **AND** internal navigation MUST not trigger duplicate user bootstrap fetches

### Requirement: No Raw Session Payload In Client Auth Contract
The system MUST keep token-bearing auth-session payloads out of the application's client-facing auth contract.

#### Scenario: Login returns successfully
- **WHEN** the login process succeeds
- **THEN** the app-facing login contract MUST not expose `access_token`, `refresh_token`, expiration metadata, or the raw Supabase session object to UI consumers

#### Scenario: App-owned auth transport resolves
- **WHEN** an application-owned login or logout endpoint returns to the browser
- **THEN** its response contract MUST remain free of token-bearing session fields
- **AND** the client MUST continue consuming only the constrained authenticated-user DTO flow where needed

#### Scenario: Shared auth state is consumed
- **WHEN** authenticated UI code reads the shared auth source
- **THEN** that source MUST expose only the constrained user DTO
