# voucher-form-calculations Specification

## Purpose
Keeps voucher-entry amounts, parser data, client limits, and document previews consistent with the authoritative voucher rules.
## Requirements
### Requirement: Calculated voucher totals are read-only
The system SHALL calculate and display read-only gross and net amounts reactively while a user creates or edits a voucher. For sales, gross amount SHALL equal subtotal plus VAT and net amount SHALL equal gross amount minus retentions. For purchases, gross amount SHALL equal subtotal plus VAT, non-taxable amount, and exempt amount; net amount SHALL equal gross amount plus perceptions.

#### Scenario: User changes a sales retention
- **WHEN** a user adds, removes, or changes a sales retention amount
- **THEN** the displayed gross amount remains subtotal plus VAT
- **AND** the displayed net amount updates to subtract the current retention total

#### Scenario: User changes a purchase perception
- **WHEN** a user adds, removes, or changes a purchase perception or another purchase amount component
- **THEN** the displayed gross and net amounts update from the purchase formula
- **AND** neither calculated amount is directly editable

### Requirement: Sales exclude purchase-only amount fields
The system SHALL not display non-taxable amount, exempt amount, or other taxes in sales voucher forms. New or updated sales vouchers SHALL persist those three values as zero.

#### Scenario: User edits a sales voucher
- **WHEN** a user opens a sales voucher for creation or editing
- **THEN** the purchase-only amount fields are not displayed
- **AND** saving the voucher stores zero for those fields

### Requirement: Purchase other taxes use the perception boundary
The system SHALL not display a direct `otherTaxesAmount` input in purchase forms. New or updated purchase vouchers SHALL persist `otherTaxesAmount` as zero. Recognized purchase perception concepts SHALL remain separate, while unmapped purchase tax lines SHALL be aggregated into one perception using the catalog concept `Otros Impuestos`. The aggregated amount SHALL contribute to the purchase net amount through perceptions and SHALL not be added to the purchase gross amount as a separate other-tax component. Existing historical `otherTaxesAmount` values SHALL remain readable and unchanged until the voucher is updated.

#### Scenario: User opens a purchase form
- **WHEN** a user creates or edits a purchase voucher
- **THEN** the form displays non-taxable and exempt amount inputs but no direct other-taxes input
- **AND** saving the purchase sends no independent other-taxes value for persistence

#### Scenario: Parser detects multiple unmapped purchase taxes
- **WHEN** the parser detects multiple purchase tax lines that do not match a known perception concept
- **THEN** the backend creates one `Otros Impuestos` perception with the sum of those line amounts
- **AND** recognized perception lines remain separate
- **AND** the generic parser `otherTaxesAmount` is ignored when applicable tax lines already exist

#### Scenario: Parser detects only a generic purchase other-tax amount
- **WHEN** the parser provides a generic purchase `otherTaxesAmount` without applicable tax lines
- **THEN** the backend creates one `Otros Impuestos` perception with that amount
- **AND** persists purchase `otherTaxesAmount` as zero

### Requirement: Parser does not supply calculated totals
The system SHALL not expose or persist `totalAmount` in parsed voucher data. For a sales voucher with letter B, the backend MAY receive a transient provider-level `taxIncludedAmount` and SHALL use it only to calculate `subtotal = taxIncludedAmount - vatAmount` before building the parsed response. The transient value SHALL not be included in `ParsedVoucherData`, form patches, client responses, form state, voucher payloads, or persistence. Parsed subtotal, VAT, tax components, retentions, and perceptions SHALL remain editable inputs to the calculated-total rules.

#### Scenario: Parser response is applied to a purchase form
- **WHEN** parsed purchase data is applied to a voucher form
- **THEN** the form does not receive a parser-provided total amount
- **AND** it calculates gross and net amounts from the parsed components

#### Scenario: Backend resolves a B-voucher subtotal from the source document
- **WHEN** the backend parser extracts a sales voucher with letter B and a tax-included source amount
- **THEN** the backend calculates subtotal as the tax-included source amount minus the parsed VAT amount
- **AND** the UI receives only the resolved subtotal and component fields
- **AND** the tax-included source amount is not shown, returned, stored, or used as a persisted total

### Requirement: Backend validates authoritative voucher amounts and input boundaries
The backend SHALL calculate voucher amounts before persistence and SHALL reject invalid request values with a clear Spanish validation response instead of an internal error. Request validation limits SHALL not exceed the corresponding database storage limits.

#### Scenario: Voucher number exceeds storage limit
- **WHEN** a create or update request includes a voucher number longer than the supported stored length
- **THEN** the backend returns a client validation response with an actionable Spanish message
- **AND** it does not attempt database persistence

#### Scenario: Batch upload exceeds aggregate size
- **WHEN** the combined uploaded parser files exceed the configured aggregate size limit
- **THEN** the upload endpoint returns the configured Spanish size-limit message as a client validation response
- **AND** it does not create a parser batch

### Requirement: User-supplied dates use a canonical valid range
The system SHALL accept user-supplied dates only in exact `YYYY-MM-DD` format, only when they represent a real calendar date, and only when they are between `1900-01-01` and `2100-12-31` inclusive. It SHALL not coerce, replace, normalize, or silently fall back from invalid date values.

#### Scenario: Malformed payment date is submitted
- **WHEN** a voucher form, API payload, parser payload, or import payload contains `paymentDate` equal to `62026-09-01`
- **THEN** the value is rejected as invalid
- **AND** it is never persisted or replaced with another date

#### Scenario: Impossible calendar date is submitted
- **WHEN** a user-supplied date contains an impossible day and month combination
- **THEN** the system rejects the field as invalid
- **AND** it does not create, update, or persist the affected record

### Requirement: Date validation is enforced at every boundary
The system SHALL enforce the canonical date rule for voucher date, accounting period, payment date, date filters, and every other user-supplied date field in forms, API payloads, parser/import flows, domain validation, and persistence. Forms SHALL show a short Spanish field-level message and SHALL not submit while a date is invalid. Parser or import items with invalid dates SHALL require correction or review rather than persistence.

#### Scenario: Form date is invalid
- **WHEN** a user enters an invalid voucher date, accounting period, or payment date
- **THEN** the form displays a short Spanish error on that field
- **AND** it blocks submission until the user corrects it

#### Scenario: Parser produces an invalid date
- **WHEN** parser or OCR output includes an invalid date
- **THEN** the affected item is kept for manual correction or review
- **AND** no substituted date is persisted

### Requirement: Date integrity is protected and diagnosable
The system SHALL enforce the supported date range through database constraints where the database stores user-supplied dates. Domain and persistence boundaries SHALL reject invalid values as a final application guard. If a legacy corrupt date is encountered during a read, the affected operation SHALL return a diagnosable integrity error and log operation, entity ID, company ID, field name, and workflow state without logging secrets or personal data; unrelated dashboard data SHALL remain available.

#### Scenario: Direct database write uses an unsupported year
- **WHEN** a direct SQL or script write attempts to persist a user-supplied voucher date outside the supported range
- **THEN** the database rejects the write

#### Scenario: Read encounters legacy corrupt date data
- **WHEN** a read encounters a legacy date value outside the supported range
- **THEN** the affected resource returns a diagnosable integrity error
- **AND** the system logs the affected entity and date field without personal data
- **AND** unrelated dashboard resources remain available

### Requirement: Raster previews support image controls
The system SHALL provide zoom controls and clockwise and counterclockwise 90-degree rotation controls for PNG and JPEG voucher previews. PDF previews SHALL retain their existing PDF-specific controls and SHALL not show image-rotation controls. Closing a modal SHALL reset all preview controls.

#### Scenario: User rotates an image preview
- **WHEN** a user opens a PNG or JPEG preview and selects a rotation control
- **THEN** the image rotates by 90 degrees in the selected direction
- **AND** the user can zoom the rotated image

#### Scenario: User reopens a preview
- **WHEN** a user closes and reopens a voucher preview
- **THEN** the zoom and rotation are restored to their initial values

