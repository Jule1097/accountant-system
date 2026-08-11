## ADDED Requirements

### Requirement: Analytics KPI Metrics
The system SHALL display 4 high-level KPI cards on the Analytics screen.

#### Scenario: Analytics view displays metrics
- **WHEN** the user navigates to the Analytics view
- **THEN** the screen displays 4 cards: Facturación del Mes, Egresos del Mes, Margen Neto Mensual, and Punto de Equilibrio
- **AND** the values of amounts and percentages are styled with monospace (`font-mono` / `DM Mono`) alignment

### Requirement: Double Bar Trend Chart
The system SHALL render a double bar trend chart showing side-by-side Income and Expenses.

#### Scenario: Trend chart renders side-by-side bars
- **WHEN** the user views the Analytics trend chart
- **THEN** the chart uses responsive SVG rendering to show 6 monthly groups
- **AND** each monthly group displays side-by-side bars for Income (green, `#10B981`) and Expenses (red, `#EF4444`)

### Requirement: Donut Distribution Chart
The system SHALL render a donut chart representing "Distribución de Egresos".

#### Scenario: Donut chart displays category percentages
- **WHEN** the user views the Donut chart on Analytics screen
- **THEN** the chart is rendered using SVG `<circle>` strokes calculated programmatically with stroke circumference of `314.16`
- **AND** the center overlay text displays the total percentage or value
- **AND** a category legend (Sueldos, Servicios, Otros) is displayed underneath

### Requirement: Period Comparison and Concentration Lists
The system SHALL display period comparison grids and top clients/suppliers concentration lists.

#### Scenario: Analytics view displays comparison grids and lists
- **WHEN** the user navigates to the Analytics view
- **THEN** the screen displays a "Comparación Mensual" table showing Period, Income, Expenses, and Margins with positive margins highlighted in green pills
- **AND** the bottom displays "Concentración de Clientes" and "Concentración de Proveedores" top lists side-by-side
