## Purpose

Define the batch-based review workflow that lets users inspect staged parser results with document previews, validate them, retry failures, and hand off approved items for asynchronous persistence.

## ADDED Requirements

### Requirement: Batch Review Context
The system MUST present staged parser results through the existing card-based `conciliations` experience, scoped to the active company, the current voucher type tab, and optionally a specific parsing batch when `batchId` is present.

#### Scenario: User opens a completed parsing batch
- **WHEN** a user opens a parsing batch that has completed background parsing
- **THEN** the system MUST show the staged items for that batch only

#### Scenario: Batch route state is restored
- **WHEN** a user opens or refreshes a `conciliations` URL containing `batchId`, `tab`, and `page`
- **THEN** the system MUST restore that same batch review context from the URL

#### Scenario: User opens conciliations without a batch id
- **WHEN** a user opens or refreshes `conciliations` without `batchId`
- **THEN** the system MUST reconstruct the visible review state from backend data for the active company and current tab
- **AND** it MUST show only invoices that belong to that company and tab context

#### Scenario: User opens a resolved batch link from a notification
- **WHEN** a user reaches `conciliations` with a `batchId` that no longer contains operational staged items
- **THEN** the system MUST redirect the user to the same tab in the non-batch conciliations view
- **AND** it MUST show a short user-facing message explaining that the invoices from that upload no longer require review

### Requirement: Company-Scoped Tab Isolation
The system MUST keep sales and purchases parsing processes logically independent while exposing a company-scoped shared review queue.

#### Scenario: Purchases are processing while user opens sales
- **WHEN** one or more purchase parsing batches are still active
- **AND** the user opens the `Ventas` tab in `conciliations`
- **THEN** the system MUST NOT show purchase processing cards or purchase review noise in the sales tab

#### Scenario: Two users of the same company open conciliations
- **WHEN** multiple users belong to the same active company
- **THEN** the `conciliations` review dataset MUST be shared at company scope
- **AND** it MUST NOT be restricted to only the invoices uploaded by the current user

### Requirement: Batch Review Status Normalization
The system MUST keep staged item technical status identifiers in English while displaying Spanish labels in the UI, and it MUST visually normalize `queued` and `processing` into a single visible processing state.

#### Scenario: Review list renders a queued item
- **WHEN** a staged item has the technical status `queued`
- **THEN** the system MUST keep the technical identifier unchanged in data contracts
- **AND** it MUST display the Spanish label `Procesando` in the UI

#### Scenario: Review list renders a processing item
- **WHEN** a staged item has the technical status `processing`
- **THEN** the system MUST keep the technical identifier unchanged in data contracts
- **AND** it MUST display the Spanish label `Procesando` in the UI

#### Scenario: Review list renders a ready item
- **WHEN** a staged item has the technical status `ready`
- **THEN** the system MUST display the Spanish label `Lista` in the UI

#### Scenario: Review list renders a validated item
- **WHEN** a staged item has the technical status `validated`
- **THEN** the system MUST keep the technical identifier unchanged in data contracts
- **AND** it MUST display the Spanish label `Validada` in the UI

#### Scenario: Review list renders an error item
- **WHEN** a staged item has the technical status `error` or `duplicate`
- **THEN** the system MUST keep the technical identifier unchanged in data contracts
- **AND** the system MUST display the corresponding Spanish label in the UI

### Requirement: Per-Item Contextual Review Actions
The system MUST expose the current action available for each staged item according to its latest parsing state.

#### Scenario: Item failed parsing
- **WHEN** a staged batch item is currently failed
- **THEN** the system MUST show a retry action for that item
- **AND** retrying the item MUST reprocess the same logical item within the same batch

#### Scenario: Item parsed successfully
- **WHEN** a staged batch item is currently ready for review
- **THEN** the system MUST show a review action for that item

#### Scenario: Item is a duplicate
- **WHEN** a staged batch item is currently duplicate
- **THEN** the system MUST show a discard action for that item

#### Scenario: Item is ready, validated, or failed
- **WHEN** a staged batch item is currently ready, validated, or failed
- **THEN** the system MUST show a discard action for that item

#### Scenario: User selects multiple operational staged items
- **WHEN** the current conciliations dataset contains removable staged items in `Lista`, `Validada`, `Error`, or `Duplicada`
- **THEN** the system MUST allow the user to select multiple items
- **AND** it MUST expose a bulk discard action for the selected items only

### Requirement: Processing Cards Stay In Conciliations Until Completion
The system MUST show still-active invoice cards in a dedicated processing section at the top of the current `conciliations` tab until each corresponding batch item finishes parsing.

#### Scenario: User opens conciliations while parsing is still active
- **WHEN** the current company and tab still have staged items in `queued` or `processing`
- **THEN** the system MUST render a dedicated top section for invoices being processed
- **AND** those cards MUST use the same card-based visual system as the rest of `conciliations`

#### Scenario: Active processing finishes
- **WHEN** all active staged items for a given batch item leave `queued` and `processing`
- **THEN** the corresponding cards MUST disappear from the processing section
- **AND** they MUST reappear in the appropriate review result area according to their final status

### Requirement: Conciliations Uses Operational State Sections
The system MUST render the review queue in dedicated visible-state sections rather than a single mixed list.

#### Scenario: Current tab contains ready and validated invoices
- **WHEN** the current conciliations tab contains invoices in `Lista` and `Validada`
- **THEN** the system MUST render separate sections for those two visible states
- **AND** the validated invoices MUST remain visible in their own actionable section instead of appearing at the end of the ready-review queue

#### Scenario: Current tab contains no items for a section
- **WHEN** one visible-state section has no items for the current context
- **THEN** the system MUST omit that section instead of rendering an empty operational container

### Requirement: Review Result Ordering
The system MUST keep the card ordering in `conciliations` predictable and prioritize processing visibility first.

#### Scenario: Conciliations contains mixed visible states
- **WHEN** the current tab contains invoices in multiple visible states
- **THEN** the system MUST order cards by visible state priority as `Procesando`, `Lista`, `Validada`, `Duplicada`, `Error`

#### Scenario: A ready invoice becomes validated
- **WHEN** a user validates an invoice that was previously in `Lista`
- **THEN** the invoice MUST move into the `Validada` section
- **AND** it MUST NOT be appended to the end of the ready-review section

### Requirement: Stable Per-Item Progress Feedback
The system MUST keep the current card visible while retry or persistence is in progress and update only the affected item state.

#### Scenario: User retries a failed item
- **WHEN** a user retries a failed staged item
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show progress only on the affected item card
- **AND** the retried card MUST return to the visible `Procesando` state while the retry is active

#### Scenario: User confirms a validated item
- **WHEN** a user confirms a validated staged item
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show progress only on the affected item card

#### Scenario: User validates a reviewed item
- **WHEN** a user accepts review for a staged item and the validation request is still in flight
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show a visible loading state on the affected item or review surface until the validation request resolves

#### Scenario: User confirms one validated item for direct persistence
- **WHEN** a user triggers immediate persistence for one validated item and the request is still in flight
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show a visible loading state on the affected item card until the persistence request resolves
- **AND** it MUST prevent repeated confirmation clicks while that item is still processing

#### Scenario: User discards multiple staged items
- **WHEN** a user discards multiple selected staged items
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show progress scoped to the discard action without replacing the whole conciliations view

### Requirement: Compact Cards With Icon Actions
The system MUST keep conciliations visually compact and action-oriented.

#### Scenario: Conciliations renders an actionable card
- **WHEN** a card exposes review, confirm, retry, or delete actions
- **THEN** those per-item actions MUST be rendered as icon buttons with accessible labels and tooltips
- **AND** the card layout MUST remain compact enough to keep more than one invoice visible without excessive vertical spacing

#### Scenario: Conciliations header is rendered
- **WHEN** the page header is shown
- **THEN** it MUST stay focused on operational context such as tabs, batch filter state, and current actions
- **AND** it MUST NOT render analytical summary cards or KPI tiles

### Requirement: Modal-Based Validation With Source Preview
The system MUST let users review a staged item inside a modal that reuses the current voucher form flow and also displays the temporary source document preview.

#### Scenario: User reviews a staged sales item
- **WHEN** a user opens review for a staged sales item
- **THEN** the system MUST open the existing sales voucher modal flow populated with the staged parsed data
- **AND** it MUST display the temporary source document preview alongside that review form within the same modal container

#### Scenario: User reviews a staged purchases item
- **WHEN** a user opens review for a staged purchases item
- **THEN** the system MUST open the existing purchases voucher modal flow populated with the staged parsed data
- **AND** it MUST display the temporary source document preview alongside that review form within the same modal container

#### Scenario: Reviewed invoice uses a foreign currency
- **WHEN** the parsed or manually selected invoice currency is different from ARS
- **THEN** the review modal MUST display the invoice exchange-rate field
- **AND** the accepted validated payload MUST preserve that exchange rate for both immediate persistence and batch persistence handoff

### Requirement: Review Acceptance Marks Items As Validated
Accepting the review MUST mark the staged item as validated and eligible for immediate individual persistence or asynchronous batch persistence.

#### Scenario: User accepts a reviewed item
- **WHEN** a user finishes reviewing a staged item and accepts it
- **THEN** the system MUST treat that item as validated
- **AND** the system MUST display that item as `Validada` in `conciliations` until persistence happens
- **AND** the item MUST become eligible for direct individual persistence and batch persistence
- **AND** the item MUST disappear from the active `conciliations` list after successful persistence or successful batch queue handoff

#### Scenario: User edits staged fields before acceptance
- **WHEN** a user changes staged item fields during review and accepts the item
- **THEN** the system MUST validate the accepted staged values, not only the original parser result

### Requirement: Confirmation Of Validated Items
The system MUST persist approved staged items through direct persistence for individual confirmation and asynchronous queue handoff for mass confirmation.

#### Scenario: User confirms one validated item
- **WHEN** a user confirms a single validated item
- **THEN** the system MUST persist that item immediately as a real voucher

#### Scenario: Individual persistence fails
- **WHEN** a single validated item cannot be persisted during direct confirmation
- **THEN** the system MUST return an actionable error to the user
- **AND** the staged item MUST remain available in conciliations instead of disappearing silently

#### Scenario: User confirms all validated items in the batch
- **WHEN** a user triggers mass confirmation for the batch
- **THEN** the system MUST enqueue all currently validated items of that batch for asynchronous real voucher persistence

#### Scenario: Batch contains no validated items
- **WHEN** the current batch contains no validated items
- **THEN** the system MUST hide or disable the mass confirmation CTA with explanatory UI text

### Requirement: Discard Removes Temporary Staging
Discarding staged items MUST remove them from the temporary review dataset instead of preserving a historical discarded record.

#### Scenario: User discards a staged item
- **WHEN** a user discards a staged item during the review workflow
- **THEN** the system MUST remove that item from temporary staging
- **AND** it MUST remove the associated temporary source file

#### Scenario: User discards multiple staged items
- **WHEN** a user confirms bulk discard for selected staged items
- **THEN** the system MUST remove each selected item from temporary staging
- **AND** it MUST remove the associated temporary source file for each selected item

### Requirement: Contextual Empty States
The system MUST display contextual empty states for the current `conciliations` batch and tab instead of a generic message.

#### Scenario: Current tab has no items
- **WHEN** the current batch tab has no staged items to show
- **THEN** the system MUST display an empty state message specific to that tab and batch context

### Requirement: Conciliations Layout Width Stays Stable
The system MUST keep the main conciliations content width stable across page changes so pagination and surrounding controls do not shift position when card content changes.

#### Scenario: User changes between conciliations pages
- **WHEN** the user navigates between conciliations pages with cards of different content widths
- **THEN** the main list container MUST keep a stable width
- **AND** the pagination controls MUST remain visually anchored instead of jumping horizontally

#### Scenario: Ready-review section spans multiple pages
- **WHEN** the `Lista` section contains more invoices than fit on one page
- **THEN** the page-level pagination MUST apply to the ready-review section without shifting the position of the surrounding operational layout

### Requirement: Expired Staging Disappears From Conciliations
The system MUST treat expired staged parsing items as removed from the operational conciliations review experience.

#### Scenario: A staged item expires
- **WHEN** a staged item reaches its expiration cleanup path
- **THEN** the system MUST remove that item from the visible `conciliations` dataset
- **AND** the UI MUST NOT keep a visible expired placeholder card
