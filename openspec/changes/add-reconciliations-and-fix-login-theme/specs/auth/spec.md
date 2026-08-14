## Purpose

The authentication specification defines the visual theme adaptability requirements for the components within the Login screen.

## ADDED Requirements

### Requirement: Theme support in Login Card container
The login screen (/login) SHALL dynamically adapt background, border, input field, and text colors of its main container (Login Card) depending on the active application theme.

#### Scenario: Rendering in Light Mode (White Mode)
- **WHEN** a user visits the login page with the system theme configured in light mode (white mode)
- **THEN** the Login Card container SHALL display a light background color (#FFFFFF or #FAFAF7) and dark high-contrast texts.

#### Scenario: Rendering in Dark Mode
- **WHEN** a user visits the login page with the system theme configured in dark mode
- **THEN** the Login Card container SHALL display a dark background color (#141417 or #0A0A0B) and light-colored texts.
