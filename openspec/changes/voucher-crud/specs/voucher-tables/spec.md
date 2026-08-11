## ADDED Requirements

### Requirement: Persistent Voucher Submission
The system MUST persist voucher creation and voucher editing from the sales and purchases modal flows instead of keeping those save actions disabled or local-only.

#### Scenario: User creates a voucher from the modal
- **WHEN** the user submits a valid sales or purchases voucher from the "Agregar" modal
- **THEN** the system MUST persist the voucher through the vouchers API
- **AND** it MUST refresh the visible table data
- **AND** it MUST show a success toast

#### Scenario: System prevents duplicate vouchers
- **WHEN** the user attempts to create or update a voucher that duplicates an existing voucher for the same company and third party
- **THEN** the system MUST keep the modal open
- **AND** it MUST show a clear Spanish error indicating that the voucher is already registered

### Requirement: URL-Driven Voucher Detail Modal
The system MUST drive the voucher detail modal from a `voucherId` query string so purchases and sales can load the persisted voucher detail by identifier before editing.

#### Scenario: User opens voucher detail from the voucher row
- **WHEN** the user clicks the voucher row identifier in the Sales or Purchases table
- **THEN** the system MUST write the selected `voucherId` to the URL query string
- **AND** the detail modal MUST open using that `voucherId` as the source of truth

#### Scenario: User refreshes or shares a detail URL
- **WHEN** the page loads with a valid `voucherId` query string
- **THEN** the system MUST open the detail modal for that voucher automatically

#### Scenario: Voucher detail loads before form rendering
- **WHEN** the detail modal opens for a selected `voucherId`
- **THEN** the system MUST show a loading indicator inside the modal while the voucher detail is fetched from the backend
- **AND** once the request completes successfully, the modal MUST render the editable form populated with the persisted voucher data

#### Scenario: Voucher detail URL points to a missing voucher
- **WHEN** the page loads or updates with a `voucherId` query string that does not exist
- **THEN** the system MUST show a toast indicating that the voucher does not exist
- **AND** it MUST clear the invalid `voucherId` from the URL

#### Scenario: User saves voucher edits
- **WHEN** the user submits a valid edit in the voucher detail modal
- **THEN** the system MUST persist the update through the vouchers API
- **AND** it MUST refresh the visible table data
- **AND** it MUST keep the UI aligned with the persisted voucher detail

### Requirement: Voucher Deletion Confirmation From Table
The system MUST expose voucher deletion as a dedicated trash action in each sales and purchases table row, protected by a confirmation modal.

#### Scenario: User starts voucher deletion from the table
- **WHEN** the user clicks the delete icon shown in a voucher row
- **THEN** the system MUST open a confirmation modal before performing deletion

#### Scenario: User confirms voucher deletion
- **WHEN** the user confirms voucher deletion from the confirmation modal
- **THEN** the system MUST physically delete the voucher through the vouchers API
- **AND** it MUST refresh the visible table data
- **AND** it MUST show a success toast
- **AND** it MUST clear `voucherId` from the URL if the deleted voucher was selected

#### Scenario: User cancels voucher deletion
- **WHEN** the user cancels the confirmation modal
- **THEN** the system MUST keep the voucher unchanged and close the confirmation modal
