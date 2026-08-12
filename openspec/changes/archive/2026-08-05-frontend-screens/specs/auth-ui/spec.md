## Purpose

Provides an isolated user interface for user authentication, separate from the main application layout.

## ADDED Requirements

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
- **THEN** the system hardcodes a redirect to the `/dashboard` route as a placeholder for real authentication logic
