## MODIFIED Requirements

### Requirement: Form Validation Support
The system SHALL use robust form management (React Hook Form + Zod) for the login inputs to ensure client-side validation is supported.

#### Scenario: User submits empty form
- **WHEN** user clicks "Ingresar" without filling the fields
- **THEN** the form displays appropriate validation errors

#### Scenario: User successfully logs in
- **WHEN** user clicks "Ingresar" with valid credentials
- **THEN** the system authenticates the user using Supabase Auth
- **AND** redirects the user to the `/dashboard` route.

## ADDED Requirements

### Requirement: Private Route Protection
The system SHALL protect all application routes (e.g. `/dashboard`, `/sales`, `/purchases`, `/analytics`) at the middleware level, requiring an active user session.

#### Scenario: Unauthenticated user accesses private route
- **WHEN** an unauthenticated user attempts to navigate to a private route
- **THEN** the system redirects the user to `/login`.

#### Scenario: Authenticated user accesses private route
- **WHEN** an authenticated user navigates to a private route
- **THEN** the system allows access and displays the corresponding view.
