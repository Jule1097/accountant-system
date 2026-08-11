## MODIFIED Requirements

### Requirement: Gemini AI Parsing and Structured Extraction
The system MUST send the file buffer to the Gemini API with a prompt requesting structured voucher fields that match the current voucher model. The extracted response MUST support voucher taxes, VAT breakdown, sales retentions, purchase perceptions, and shared third-party semantics. If a CUIT is successfully extracted, the system MUST perform a database lookup to check if a matching third party is already registered in the active company. If found, it MUST return the resolved third-party identifier in the response.

#### Scenario: Successful AI extraction with existing contact
- **WHEN** Gemini successfully identifies invoice fields including a CUIT that exists in the active company's clients or suppliers
- **THEN** the system MUST return the extracted fields and the resolved third-party identifier in the success payload

#### Scenario: Successful AI extraction with non-existing contact
- **WHEN** Gemini successfully identifies invoice fields including a CUIT that does not exist in the active company
- **THEN** the system MUST return the extracted fields and set the resolved third-party identifier to null in the success payload

#### Scenario: Parser returns voucher tax components
- **WHEN** Gemini successfully identifies voucher amounts that map to VAT breakdown, non-taxable amounts, exempt amounts, other taxes, retentions, or perceptions
- **THEN** the system MUST return those values in a response shape aligned with the voucher form contract

#### Scenario: Parser resolves tax concepts and jurisdictions
- **WHEN** Gemini identifies retentions or perceptions with concept names or jurisdiction labels
- **THEN** the system MUST resolve those values against the active catalogs and return the matched concept and jurisdiction identifiers when available
- **AND** it MUST preserve human-readable values for manual review when an identifier match is not available

#### Scenario: Active company CUIT is detected on the document
- **WHEN** Gemini extracts a CUIT that matches the active company
- **THEN** the system MUST exclude that CUIT from the returned third-party data and avoid treating it as the document counterparty

### Requirement: Extraction Fallback for Missing Fields
If the Gemini model fails to extract any specific field(s) from the document, the endpoint MUST return missing scalar fields as null and missing collections as empty arrays, allowing the user to complete them manually. The system MUST prefer omission over guessed values when the document does not provide enough evidence.

#### Scenario: Incomplete extraction of scalar fields
- **WHEN** Gemini fails to detect one or more scalar fields such as point of sale, voucher number, CUIT, or payment data
- **THEN** the system MUST return the successfully extracted fields and set any missing scalar fields to null

#### Scenario: Incomplete extraction of collection fields
- **WHEN** Gemini fails to detect VAT details, retentions, or perceptions
- **THEN** the system MUST return empty arrays for those collections instead of fabricated line items
