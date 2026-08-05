## Purpose

Provides a secure middleware layer to protect API routes, handle cross-origin constraints, enforce rate limits, and isolate data on a multi-tenant company basis.

## ADDED Requirements

### Requirement: CORS Policy Validation
The middleware MUST restrict cross-origin requests to same-origin by default. If additional origins are configured in the ALLOWED_ORIGINS environment variable, they MUST be allowed.

#### Scenario: Request from same-origin
- **WHEN** an HTTP request is made from the same origin to an API endpoint
- **THEN** the system MUST allow the request and include standard CORS response headers

#### Scenario: Request from allowed external origin
- **WHEN** an HTTP request is made from a domain listed in ALLOWED_ORIGINS
- **THEN** the system MUST allow the request and return CORS headers allowing that origin

#### Scenario: Request from disallowed external origin
- **WHEN** an HTTP request is made from a domain not listed in ALLOWED_ORIGINS
- **THEN** the system MUST reject the request with a CORS policy error or blocked response

### Requirement: Upstash Redis Rate Limiting
The middleware MUST limit API access to a maximum of 100 requests per minute per user ID (for authenticated users) or client IP address (for unauthenticated or initial requests).

#### Scenario: Rate limit not exceeded
- **WHEN** a user makes fewer than 100 requests in a minute
- **THEN** the system MUST allow the request to proceed to the route handler

#### Scenario: Rate limit exceeded
- **WHEN** a user exceeds 100 requests within a rolling 60-second window
- **THEN** the system MUST return a 429 Too Many Requests response with a Spanish warning message

### Requirement: Supabase Auth Session Refresh
The middleware MUST verify the user's active session using @supabase/ssr. If near-expired, it MUST refresh the session tokens and update the response cookies.

#### Scenario: Valid authenticated request
- **WHEN** a request contains a valid session cookie
- **THEN** the system MUST proceed and refresh the cookie if it is close to expiration

#### Scenario: Unauthenticated request
- **WHEN** a request lacks a valid session cookie or token
- **THEN** the system MUST redirect to the login page or return a 401 Unauthorized JSON response

### Requirement: Company-Level Data Isolation
The middleware MUST validate that requests target a company that the authenticated user belongs to. The active company ID is extracted from the x-company-id header, or inferred if the user belongs to exactly one company.

#### Scenario: Header present and user belongs to company
- **WHEN** a request includes x-company-id header and the user belongs to that company
- **THEN** the system MUST allow the request to proceed to the controller

#### Scenario: Header present and user does not belong to company
- **WHEN** a request includes x-company-id header but the user does not belong to that company
- **THEN** the system MUST reject the request with a 403 Forbidden status code and a Spanish error message

#### Scenario: Header missing and user belongs to exactly one company
- **WHEN** the x-company-id header is missing and the user belongs to exactly one company in the database
- **THEN** the system MUST automatically infer the company ID and allow the request to proceed

#### Scenario: Header missing and user belongs to multiple companies
- **WHEN** the x-company-id header is missing and the user is associated with multiple companies
- **THEN** the system MUST reject the request with a 400 Bad Request status code and a Spanish message requiring the header
