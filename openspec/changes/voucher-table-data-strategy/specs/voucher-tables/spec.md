## MODIFIED Requirements

### Requirement: Voucher Tables Structure
The system SHALL display data tables on the Sales and Purchases screens. The tables MUST include standard columns for Date, Voucher Details (Type, Letter, POS, Number), Client/Supplier, Total Amount, and Status.

#### Scenario: Sales table renders standard columns
- **WHEN** the user views the Sales screen
- **THEN** the table displays columns for Fecha, Comprobante, Cliente, Importe Total, and Estado
- **AND** the data is loaded from a server-side paginated vouchers dataset for `type=sale`
- **AND** the route query string persists at least the current page, page size, search term, active filters, sorting, and `voucherId` when present

#### Scenario: Purchases table renders standard columns
- **WHEN** the user views the Purchases screen
- **THEN** the table displays columns for Fecha, Comprobante, Proveedor, Importe Total, and Estado
- **AND** the data is loaded from a server-side paginated vouchers dataset for `type=purchase`
- **AND** the route query string persists at least the current page, page size, search term, active filters, sorting, and `voucherId` when present

#### Scenario: Voucher tables expose paginated metadata
- **WHEN** a vouchers dataset is loaded for sales or purchases
- **THEN** the response contract MUST include `items`, `page`, `pageSize`, `total`, and `totalPages`

#### Scenario: User changes page size
- **WHEN** a user selects a different voucher table page size
- **THEN** the system MUST support page sizes of 10, 20, and 50 items
- **AND** the route query string MUST reflect the selected page size

#### Scenario: User clears or changes a dataset filter
- **WHEN** a user changes the effective search term or clears active filters on a voucher table
- **THEN** the system MUST reset the dataset to the first page before requesting the new result set

#### Scenario: User deletes the last voucher from a page
- **WHEN** a deletion leaves the current voucher table page without remaining items and a previous page exists
- **THEN** the system MUST navigate the dataset back to the previous page

#### Scenario: User searches voucher data
- **WHEN** a user performs a voucher table search
- **THEN** the system MUST search against the third-party name, CUIT, and composed voucher identifier

#### Scenario: User filters and sorts voucher data
- **WHEN** a user applies voucher dataset controls
- **THEN** the system MUST support server-side filtering by `status`, `dateFrom`, and `dateTo`
- **AND** the system MUST support explicit sorting only by composed voucher identifier, status, or date

### Requirement: Voucher KPI Summaries Follow the Filtered Dataset
The system SHALL keep the sales and purchases KPI cards synchronized with the full filtered voucher dataset instead of the current page subset.

#### Scenario: User views voucher KPIs without filters
- **WHEN** the user opens the Sales or Purchases screen without additional filters
- **THEN** the KPI cards MUST display summaries derived from the full matching voucher dataset for that route

#### Scenario: User applies voucher filters
- **WHEN** the user applies search terms, date filters, or status filters on the Sales or Purchases screen
- **THEN** the KPI cards MUST update to reflect the full filtered dataset that matches those controls
- **AND** the KPI cards MUST NOT be limited to only the currently visible table page
