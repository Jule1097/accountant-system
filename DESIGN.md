# Frontend Design Guidelines

This document outlines the visual aesthetics, grid systems, custom SVG charting paradigms, and typography guidelines established in the application, specifically drawing from the conventions implemented in the Analytics module.

## Layout & Grid System

### Screen Structure
- Page titles must be styled using `text-3xl font-bold tracking-tight`.
- Page subtitles or descriptions must be styled using `text-sm text-muted-foreground`.
- Inner content layouts must use consistent vertical spacing, such as `space-y-6` on the root container.

### Grid Layouts
- **KPI Metrics Grid**: Standard KPI grids utilize a responsive 4-column structure:
  ```tsx
  className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
  ```
- **Visualization Grid**: Combining charts or primary visual components uses a 3-column split where the main chart takes two columns and secondary widgets take one:
  ```tsx
  className="grid gap-4 lg:grid-cols-3"
  // Main chart container uses: lg:col-span-2 relative
  ```

## Color Palette & Theme Support

The application utilizes design system tokens mapping cleanly between light and dark modes. Avoid hardcoding specific HEX colors on layout nodes, preferring utility classes referencing theme variables.

### Semantic Indicators
- **Positive (Success / Gain)**: Use emerald green.
  - Text: `text-emerald-500`
  - Pill badge background: `bg-emerald-500/10`
  - SVG Stroke: `stroke-emerald-500`
  - SVG Fill: `#10b981`
- **Negative (Danger / Loss)**: Use rose red.
  - Text: `text-rose-500`
  - Pill badge background: `bg-rose-500/10`
  - SVG Stroke: `stroke-rose-500`
  - SVG Fill: `#f43f5e`
- **Neutral/Informative (Notice / Progress)**: Use blue/indigo.
  - Text: `text-blue-500` or `text-indigo-500`
  - Pill badge background: `bg-blue-500/10` or `bg-indigo-500/10`

### Interactive Overlays & Cards
- Cards must use standard background and foreground tokens: `bg-card text-card-foreground`.
- Floating elements (tooltips, popovers) must use: `bg-popover text-popover-foreground border shadow-md`.

## Custom SVG Charting Paradigms

To avoid bloated third-party charting libraries, interactive charts are constructed using native SVG elements combined with React state.

### Line & Area Trend Charts
- **Responsive Viewports**: SVG containers should use a predefined `viewBox` (e.g., `viewBox="0 0 600 280"`) and scale responsively with `w-full h-full`.
- **Dynamic Math scaling**: Scale coordinates programmatically by finding the maximum value across datasets.
  ```typescript
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses])) * 1.15;
  const getX = (idx: number) => paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
  const getY = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);
  ```
- **Area Fills**: Use SVG `<defs>` to specify linear gradients with opacity transitions for rich depth effects:
  ```xml
  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
  </linearGradient>
  ```
- **Hover Columns**: Add hidden transparent `<rect>` elements representing hover zones for each data point to trigger state changes.
- **Dotted Guidelines**: Render a vertical dashed line matching the active hovered index.

### Donut Charts
- **Radial Segment Calculations**: Segments are constructed using `<circle>` strokes and calculated offsets.
  - Circle radius: `50`, center: `60, 60`.
  - Stroke circumference: `314.16` (calculated as `2 * Math.PI * r`).
  - Active segment length: `(percentage / 100) * 314.16`.
  - Offset calculation: `- (accumulated_previous_percentages / 100) * 314.16`.
- **Center Overlay**: Center text contains the hovered segment value or total percentage.

## Data Display & Tables

- Tables must always support horizontal scrolling in smaller viewports via an `overflow-auto` wrapper.
- Typographic scaling on tables should be small and dense to accommodate high data density: `text-2xs` (approx. `10px`).
- Trend cells in tables use badge pills with clear status indicators representing changes relative to previous periods.
