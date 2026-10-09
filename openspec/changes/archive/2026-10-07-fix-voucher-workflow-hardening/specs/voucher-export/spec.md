# Spec Delta

## ADDED Requirements

### Requirement: Current-view export includes operational details
The system SHALL include `Concepto`, `Comentarios`, and localized `Estado` columns when the user selects "Exportar Vista Actual". These columns SHALL appear immediately after `Total` in that order and SHALL not be added to declaration exports.

#### Scenario: User exports the current purchase view
- **WHEN** a user selects "Exportar Vista Actual" for vouchers
- **THEN** the workbook includes Concepto, Comentarios, and Estado columns with each voucher's values
- **AND** Estado is exported as its Spanish user-facing label
- **AND** the columns appear after Total in the order Concepto, Comentarios, Estado

#### Scenario: User exports a declaration
- **WHEN** a user selects "Exportar para Declaración"
- **THEN** the workbook does not include the operational-detail columns

## MODIFIED Requirements

### Requirement: Fallback Tax Jurisdictions
The system SHALL build retention and perception jurisdiction columns from the tax jurisdictions configured in the catalog at export time. A jurisdiction added to the catalog SHALL appear automatically in subsequent exports without a source-code change, and voucher amounts linked to that jurisdiction SHALL be written to its dedicated column.

#### Scenario: Catalog gains a jurisdiction
- **WHEN** a tax jurisdiction is added to the catalog and a new voucher is saved with that jurisdiction
- **THEN** a subsequent export includes a dedicated column for that jurisdiction
- **AND** the voucher's retention or perception amount appears in that column

#### Scenario: Voucher has an outlier jurisdiction
- **WHEN** the catalog contains a jurisdiction outside the previously fixed export list, such as Chubut, and a voucher is saved with that jurisdiction
- **THEN** the export includes a dedicated Chubut column
- **AND** the jurisdiction amount is not merged into a generic fallback column
