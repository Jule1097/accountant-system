## ADDED Requirements

### Requirement: Table Navigation Pagination and Controls
The system SHALL display pagination controls at the bottom of the Sales and Purchases tables.

#### Scenario: Pagination controls render at the bottom of listings
- **WHEN** the user views the Sales or Purchases list
- **THEN** the table displays a footer row containing:
  - **Left**: Range text showing `Mostrando X-Y de Z (Pág. A de B)`
  - **Center**: Page navigation controls with the active page highlighted in brand color `#FF5C00`
  - **Right**: Page size selector dropdown button displaying `Mostrar: 10`. This select should've 3 options: 10, 20, 50. 10 as initial value. The select should be styled with the brand color `#FF5C00` for the selected value and border and hover color.

### Requirement: Action Controls and Layout
The system SHALL organize actions, search, and filters in a standardized header structure above data tables.

#### Scenario: User interacts with table header controls
- **WHEN** the user views a listing table
- **THEN** the header actions group (e.g. "Exportar" and "Agregar Compra/Venta") are positioned contiguously side-by-side on the right of the table header
- **AND** the primary call-to-action button (e.g. "Agregar") is styled in orange (`#FF5C00`)
- **AND** a control bar is placed above the table containing a search input field and a filter button aligned on the left

### Requirement: Grouped Form Modal (Agrupado)
The system SHALL organize all existing inputs, select dropdowns, and textareas inside the voucher modal into structured, logical groupings without changing or omitting any current field or event handler (like onBlur, registers, or processing states).

#### Scenario: User opens creation modal
- **WHEN** the user clicks "Agregar" on Sales or Purchases list
- **THEN** the modal form organizes all existing fields into 3 sectioned card containers (background `bg-muted/40`, border `border-border`, `rounded-lg`):
  1. *1. Identificación y Fechas*:
     - Fecha (`date`), Moneda (`currency`), Cliente / Proveedor (`thirdPartyId`), CUIT (`thirdPartyCuit`), Concepto (`concept`), and Comentarios (`comments`)
  2. *2. Numeración y Clasificación*:
     - Letra (`voucherLetterId`), Tipo Comprobante (`voucherTypeId`), Pto. Venta (`posNumber`), and Número (`number`)
  3. *3. Importes y Totales*:
     - Subtotal (`subtotal`), IVA (`vatAmount`), No Gravado (`nonTaxableAmount`), Exento (`exemptAmount`), Otros Impuestos (`otherTaxesAmount`), Importe Total (`totalAmount`), Estado (`status`), Fecha de Pago (`paymentDate`), Importe Pagado (`paidAmount`), Medio de Pago (`paymentMethod`), and any active Dynamic Tax/Retention lists
- **AND** all existing react-hook-form error messages, triggers, dynamic concept catalogs, and blur event handlers MUST remain functional and uncompromised
- **AND** the submit action button is styled with primary brand accent color `#FF5C00` at the bottom of the form

