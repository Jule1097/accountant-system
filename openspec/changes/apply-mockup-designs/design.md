## Context

See proposal.md for motivation. The application needs a cohesive dark premium design with brand orange accents (`#FF5C00`), proper pagination controls in listing tables, structured groupings in forms, and custom SVG charting in analytics.

## Goals / Non-Goals

**Goals:**
- Implement Sidebar active highlighting matching the brand active styling.
- Refactor Ventas and Compras pages to render 3 top KPI cards, a search/filter controls bar, and side-by-side Export/Add buttons in header actions.
- Add comprehensive pagination UI controls at the bottom of data listings including metrics, navigation, and page size selectors.
- Redesign the Analytics module to render 4 KPI cards, double-bar charts (income vs expenses), a donut chart for expense breakdown, and bottom grids/lists.
- Refactor the Voucher modal to follow the structured **Agrupado** card sectioning distribution.

**Non-Goals:**
- Exclude creating new database tables or updating Prisma models.
- Exclude modifying backend business logic or REST endpoints (strictly frontend UI changes).

## Decisions

### 1. Theme-Agnostic Tailwind Tokens and Accents
- **Decision**: Map all mockup layout properties (such as canvas, card backgrounds, muted labels, and border lines) to semantic Tailwind classes (`bg-background`, `bg-card`, `border-border`, `text-muted-foreground`) to natively support Dark, Light, and System themes. Use brand orange hex values (`#FF5C00`) exclusively for primary active elements, highlights, and CTA buttons (e.g. `bg-[#FF5C00]`, `text-[#FF5C00]`).
- **Rationale**: Ensures the application UI scales seamlessly when toggled between light, dark, or system modes via `next-themes`, avoiding hardcoded dark colors under light theme.
- **Alternatives Considered**: Direct HEX coding, but this breaks theme toggling.

### 2. Form Input Distribution (Agrupado)
- **Decision**: Group all `VoucherModalCoreFields` inputs, select dropdowns, textareas, and dynamic tax listings (such as retentions/perceptions) inside 3 separate section cards styled with background `bg-muted/40` and border `border-border`. Keep numbered orange headers (`#FF5C00`) above each section. Preserve 100% of existing react-hook-form handles, blur events, and validation schema hooks.
- **Nesting Taxes**: The dynamic `VoucherModalRetentions` and `VoucherModalPerceptions` components will be passed as a prop/children to `VoucherModalCoreFields` to be rendered *inside* the Section 3 card, ensuring visual consolidation.
- **Rationale**: Groups inputs logically (1. Identificación y Fechas, 2. Numeración y Clasificación, 3. Importes y Totales) to decrease visual noise, without risking functionality regression.
- **Alternatives Considered**: Modifying the fields to only show a subset matching the mockup, but this would break the validation and persistence contract.

### 3. Login Form Brand Styling
- **Decision**: Update `src/components/auth/login-form.tsx` submit button to use brand orange (`bg-[#FF5C00]`) instead of standard theme primary.
- **Rationale**: Matches the visual design of the mockups where interactive/save buttons use brand orange accent.
- **Alternatives Considered**: Keeping default theme primary, but it breaks brand design continuity.

### 4. Native SVG Charting for Analytics
- **Decision**: Use responsive SVGs with `viewBox` configurations for the double bar trend chart and donut chart. Donut sections will use calculated `<circle>` strokes: radius 50, center 60,60, and circumference `314.16`.
- **Rationale**: Prevents heavy third-party bundle weight and allows complete styling control under dark-mode constraints.
- **Alternatives Considered**: Recharts or Chart.js, but native SVGs fit the clean hexagonal/clean architecture constraints of this project phase.

### 5. Strict Mockup Component Structure Analysis
- **Decision**: Before implementing any page or component, the specific frame structure in the `.pen` file MUST be analyzed via the `pencil` MCP server (e.g., using `Get("FrameName", {depth: 3})`). The implemented React component must **strictly match** the DOM structure, spacing, and styling defined in the mockup. 
- **Rationale**: Prevents adding extra visual elements (like SVG axes, borders, or `<Card>` wrappers) that were not present in the mockup. If the mockup uses a bare Flexbox layout (`layout: "vertical"`) for a list or chart, the code must reflect that exactly without wrapping elements in generic Card components.
- **Rules to Follow**:
  - **No assumption of elements**: Do not add elements that are outside the design (e.g., if a chart has no Y-axis labels or grid lines in the `.pen` file, do not add them in code).
  - **Typography**: Always verify the exact `fontFamily` used in the text nodes of the mockup (e.g., `DM Mono` for numbers/titles, `Inter` for regular text) and map them accurately.
  - **Colors**: Pay close attention to explicit node colors (like brand orange `#FF5C00`) vs theme colors (`#141417ff` mapped to `bg-card`, etc.).

## Risks / Trade-offs

- **Risk**: Deeply nested columns/inputs in small viewport layouts.
- **Mitigation**: Standardize on responsive layouts using CSS flex/grid, wrapping controls row vertically on mobile.
