## Purpose

Aggregates financial voucher data to calculate Net Sales, Net Purchases, Credit Notes, VAT Balance, Withholding taxes, and Client/Supplier concentration for the active company, separated by currency and grouped by rolling periods.

## ADDED Requirements

### Requirement: Rolling Period Analytics
The system SHALL expose a REST endpoint `/api/analytics` that returns aggregated accounting metrics for three rolling periods backwards from the current date: Monthly (last 30 days / current month), Semiannual (last 6 months rolling), and Annual (last 12 months rolling).
All calculations MUST use the voucher's physical date (`date`).

#### Scenario: Retrieve rolling period analytics successfully
- **WHEN** the authenticated user requests `/api/analytics` with a valid `x-company-id` header
- **THEN** the system returns a 200 OK response containing three sections: `monthly`, `semiannual`, and `annual`.

### Requirement: Currency Separation
The system SHALL calculate all monetary metrics separately by currency (`$` and `USD`). The system MUST NOT sum or convert values between different currencies.

#### Scenario: Response contains currency-separated structures
- **WHEN** analytics are calculated
- **THEN** every financial total (e.g., Net Sales, Net Purchases, VAT) is returned inside a structured object grouped by currency (e.g. `{ ARS: number, USD: number }`).

### Requirement: Net Calculations and Credit Notes Isolation
The system SHALL aggregate:
- **Net Sales**: Sales subtotal minus the sum of retentions.
- **Net Purchases**: Purchases subtotal minus the sum of perceptions/retentions.
- **Credit Notes**: Sum of credit note totals, calculated and displayed separately for sales and purchases (not subtracted directly from Net Sales/Purchases).

#### Scenario: Aggregation of net values and credit notes
- **WHEN** the user queries analytics
- **THEN** the response includes separate fields for `netSales`, `netPurchases`, `salesCreditNotes`, and `purchasesCreditNotes`, each grouped by currency.

### Requirement: VAT Balance Calculation
The system SHALL calculate the VAT balance:
- **VAT Debit**: Sum of VAT details from sales.
- **VAT Credit**: Sum of VAT details from purchases.
- **Net VAT Balance**: VAT Debit minus VAT Credit.

#### Scenario: VAT balance returned by currency
- **WHEN** the user fetches analytics
- **THEN** the response contains `vatDebit`, `vatCredit`, and `vatNetBalance` for both ARS and USD.

### Requirement: Withholding Taxes Breakdown
The system SHALL aggregate retentions and perceptions grouped by `RetentionConcept` and `province` for the selected period.

#### Scenario: Retrieve withholding taxes breakdown
- **WHEN** the user requests analytics
- **THEN** the response includes lists of withholdings containing the concept name, province, and total amount.

### Requirement: Top Concentration Metrics
The system SHALL identify the top 5 clients by Net Sales volume and top 5 suppliers by Net Purchases volume.

#### Scenario: Retrieve top concentration metrics
- **WHEN** the user requests analytics
- **THEN** the response includes a list of top clients and top suppliers with their names, CUITs, and total volumes.
