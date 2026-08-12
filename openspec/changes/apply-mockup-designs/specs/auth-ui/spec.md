## ADDED Requirements

### Requirement: Login Form Brand Accent Styling
The system SHALL style the login form and its submit button with the brand accent color.

#### Scenario: Login submit button uses brand orange color
- **WHEN** the user views the `/login` page
- **THEN** the submit button is styled with the primary brand orange background (`#FF5C00`, e.g. `bg-[#FF5C00]`) and white text (`#FFFFFF`)
- **AND** the hover state of the button adjusts with opacity `bg-[#FF5C00]/90`
- **AND** the login card background maps to standard theme-aware card tokens (`bg-card border-border`)
