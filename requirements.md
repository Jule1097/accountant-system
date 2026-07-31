# Spec-Driven Development: Accounting System (Sales & Purchases)

## 1. Introduction and Scope
The purpose of this document is to specify the technical and functional requirements for the initial development of an accounting system focused on managing and storing purchase and sales vouchers for multiple companies (initially **TEEM** and **GRIB**). It includes an automated extraction feature using the Gemini API to parse PDF and image invoices via temporary buffer/memory. All development and specifications are managed using the **OpenSpec** framework.

---

## 2. Entity Architecture and Data Models (English Naming Convention)

### 2.1. Company (`Company`)
Represents the legal entities or business units within the system.
* `id` (PK, int / uuid)
* `name` (varchar, unique)
* `cuit` (varchar, unique)
* `createdAt` (timestamp)
* `updatedAt` (timestamp)

### 2.2. User and User-Company Relation (`User` & `UserCompany`)
Users will not have a self-registration flow in this phase; accounts will be provisioned directly via the database, utilizing Supabase Auth for login (using email instead of username).
* `id` (PK, uuid -> links to Supabase `auth.users.id`)
* `email` (varchar, unique)
* `createdAt` (timestamp)
* `updatedAt` (timestamp)

* **Intermediate Table (Many-to-Many Scalability):** `UserCompany`
  * `userId` (FK -> User)
  * `companyId` (FK -> Company)
  * *Phase Note:* Although the structure supports multiple companies per user, the backend will automatically infer the active company based on the user's sole association in `UserCompany`. If a user is associated with multiple companies without an active one selected, the backend will return an error.

### 2.3. Third Parties: Clients and Suppliers (`Client` & `Supplier`)
Separated into independent entities to maintain commercial role integrity. CUITs are unique per company (composite key `companyId` + `cuit`) to allow different companies to trade with the same third party. If a third party does not exist in the database when saving an invoice (manual or via AI), the system will automatically create it inline.

* **Client** (For sales invoices)
  * `id` (PK)
  * `name` (varchar)
  * `cuit` (varchar)
  * `companyId` (FK -> Company)
  * `createdAt` (timestamp)
  * `updatedAt` (timestamp)
  * *Constraint:* Unique composite index on `(companyId, cuit)`

* **Supplier** (For purchase invoices)
  * `id` (PK)
  * `name` (varchar)
  * `cuit` (varchar)
  * `companyId` (FK -> Company)
  * `createdAt` (timestamp)
  * `updatedAt` (timestamp)
  * *Constraint:* Unique composite index on `(companyId, cuit)`

### 2.4. Voucher Catalogs (Scalable CRUD)
* **VoucherType** (e.g., Invoice, Debit Note, Credit Note, Electronic MiPyME Credit Invoice)
  * `id` (PK)
  * `name` (varchar)

* **VoucherLetter** (e.g., A, B, C, M, E)
  * `id` (PK)
  * `letter` (varchar(1))

* **RetentionConcept** (Scalable catalog of retention/perception types depending on whether it is a purchase or sale)
  * `id` (PK)
  * `name` (varchar)
  * `type` (varchar: 'sale' | 'purchase')

* **VatRate** (Scalable catalog of VAT rates)
  * `id` (PK)
  * `name` (varchar, e.g., '21%', '10.5%', 'Exento')
  * `rate` (decimal, e.g., 0.21, 0.105, 0.00)

---

### 2.5. Voucher Entity (`Voucher` / Invoice)
The core entity of the system. Each voucher strictly belongs to a `Company` and can be of type **Sale** or **Purchase**. All money amounts (`subtotal`, `vatAmount`, `totalAmount`, `netAmount`) are stored in their original currency.

* `id` (PK, int / uuid)
* `companyId` (FK -> Company)
* `type` (enum/varchar: 'sale' | 'purchase')
* `voucherTypeId` (FK -> VoucherType)
* `voucherLetterId` (FK -> VoucherLetter)
* `posNumber` (varchar - Point of Sale, padded to 5 digits, e.g., '00001')
* `number` (varchar - Voucher Number, padded to 8 digits, e.g., '00000123')
* `clientId` (FK -> Client, nullable/required if sale)
* `supplierId` (FK -> Supplier, nullable/required if purchase)
* `date` (date)
* `accountingPeriod` (date - first day of the month, auto-derived from `date` but fully editable by the user)
* `currency` (varchar: '$' | 'USD')
* `exchangeRate` (number: defaults to `1` if `$`; mandatory if foreign currency like `USD`)
* `subtotal` / Net Amount (number - sum of subtotals from `VoucherVatDetail`)
* `vatAmount` (number - sum of vatAmounts from `VoucherVatDetail`)
* `totalAmount` (number)
* `netAmount` (number: Final liquid amount calculated on the backend. For Sales/Purchases: `netAmount = totalAmount - Sum(Retenciones)`. Retentions are optional. Currency conversion to ARS is calculated dynamically using `exchangeRate` in reports.)
* `concept` (text / varchar)
* `paymentMethod` (varchar)
* `status` (enum: 'pending' | 'partial' | 'paid' - Auto-calculated based on `paidAmount` vs `totalAmount`)
* `paymentDate` (date, nullable - mandatory only if `paidAmount` > 0)
* `paidAmount` (number)
* `comments` (text, nullable)
* `createdByUserId` (FK -> User, audit tracking)
* `createdAt` (timestamp)
* `updatedAt` (timestamp)

* **Constraint / Uniqueness Rule:** Combination of `companyId`, `type`, `supplierId`/`clientId`, `voucherTypeId`, `voucherLetterId`, `posNumber`, and `number` must be unique to prevent duplicate vouchers.

### 2.6. Voucher Retentions & VAT Details

* **VoucherRetention**
  Normalized relational table to handle individual retentions or perceptions applied to a voucher.
  * `id` (PK)
  * `voucherId` (FK -> Voucher)
  * `retentionConceptId` (FK -> RetentionConcept)
  * `amount` (number)
  * `province` / `jurisdiction` (varchar, nullable - specifically to support Ingresos Brutos reporting filters)

* **VoucherVatDetail** (`VoucherVatDetail`)
  Relational table for detailed breakdown of VAT by rates.
  * `id` (PK)
  * `voucherId` (FK -> Voucher)
  * `vatRateId` (FK -> VatRate)
  * `subtotal` (number)
  * `vatAmount` (number)

---

## 3. Business Rules and Initial Constraints
1. **Data Isolation by Company:** An authenticated user can only query, list, and operate on vouchers associated with the company or companies assigned in their user-company relation. The active company is automatically inferred from the user's sole association in `UserCompany`.
2. **Currency Validation:** If the currency is Argentine Pesos (`$`), the system automatically assigns `exchangeRate = 1`. If the currency is foreign (`USD`), the `exchangeRate` field becomes mandatory and must be greater than 0.
3. **Financial Calculations:**
   - In **Sales**, the flow accounts for taxes and deductions (retentions suffered by clients who are withholding agents) which decrease the liquid amount to collect (`netAmount = totalAmount - Sum(Retenciones)`).
   - In **Purchases**, costs, taxes, and associated withholdings/perceptions of the payment circuit are recorded (`netAmount = totalAmount - Sum(Retenciones)` where perceptions are already included in `totalAmount`).
4. **CUIT Uniqueness per Company:** Clients and Suppliers share a uniqueness rule on their CUIT **per company** to prevent duplicating identical entities under the same company. They are created automatically inline on save if not present.
5. **No Duplicate Vouchers:** The system strictly prohibits duplicate vouchers based on the combination of company, type, third-party, voucher type, letter, point of sale (`posNumber`), and number.
6. **Accounting Period Automation:** The system automatically derives the accounting month/period from the main `date` field (standardizing to the first day of the month) but allows the user to manually modify it.
7. **AI-Powered Extraction (Gemini API):** Users can upload invoice PDFs or images. The file is processed entirely in temporary memory (buffer) and sent to the Gemini API using a free-text prompt requesting a structured JSON. The JSON is then parsed manually in the backend. If any field is not detected by the AI, it will be left blank for manual completion. No physical files or long-term binary assets are stored in external buckets or local storage.
8. **Audit Trail:** All main entities include automatic audit fields (`createdAt`, `updatedAt`, and `createdByUserId` on vouchers) to secure complete tracking.
9. **Scalability & Catalogs:** Entities for Third Parties (`Client`, `Supplier`), `VoucherType`, `VoucherLetter`, `VatRate`, and `RetentionConcept` will feature future CRUD interfaces. A Prisma seed script handles the initial population of standard catalog data and test data.

---

## 4. API Endpoints, Response Format, and Pagination
1. **Standardized API Response Payload:** All backend REST API endpoints must return a consistent JSON response structure to guarantee predictability across frontend clients:
   - Success response: `{ success: true, data: <payload> }`
   - Error response: `{ success: false, error: "Mensaje legible en español para el usuario", details: "Technical English details or code for debugging" }`
2. **Pagination Strategy:** Offset-based pagination (`page` and `limit` query parameters) will be used across listing endpoints to facilitate fixed-block navigation and auditing.
3. **Dynamic Filtering:** All voucher listing endpoints will support dynamic filtering across all main attributes (e.g., `type`, `status`, `currency`, `clientId`, `supplierId`, `date` range, `accountingPeriod`, etc.) via query parameters.

---

## 5. Technology Stack
* **Frontend:** Next.js 16 (App Router), Shadcn/ui
* **Forms & Validation:** React Hook Form, Zod
* **AI Integration:** Gemini API (for real-time document parsing via memory buffer, with fallback/blank fields for manual entry)
* **Backend & API Architecture:** REST API endpoints (explicitly avoiding Server Actions for this phase)
* **Database & ORM:** Supabase (PostgreSQL), Prisma ORM
* **Testing:** Jest
* **Spec-Driven Development:** OpenSpec framework (managing changes, proposals, specs, design, and tasks via CLI)

---

## 6. Security, Middleware, and Access Control Specifications

### 6.1. Authentication and Session Refresh
* **Authentication Middleware:** All backend REST API endpoints (`src/app/api/...`) must be protected by a Next.js middleware that verifies the user's active session using `@supabase/ssr`.
* **Session Refreshing:** The middleware must automatically check if the Supabase session token is expired or close to expiration (via `supabase.auth.getUser()`). If so, it must refresh the session and rewrite the updated session cookies back into the HTTP response headers to prevent unexpected user logouts. Unauthenticated requests to private endpoints must return a `401 Unauthorized` JSON response. If the user isn't logged in and tries to go to any route, the system should redirect it to the `/login` page.

### 6.2. Multi-Tenancy & Company Data Isolation
* **Active Company Validation:** To ensure strict company-level data isolation:
  * The frontend client must supply the active company ID via the `x-company-id` custom HTTP header.
  * If the header is missing, the backend will query the user's company associations. If the user is associated with exactly one company, that company is inferred as active. If the user is associated with multiple companies, the backend must return a `400 Bad Request` error.
  * If the header is present, the backend/middleware must validate that the authenticated user belongs to the requested company (via `UserCompany` check). If the user does not belong to it, the system must return a `403 Forbidden` error.

### 6.3. Rate Limiting and Abuse Prevention
* **Global Rate Limiting:** Implement application-level rate limiting using middleware backed by Redis.
* **Rate Limits:** The default limit is set to 100 requests per minute per IP address or authenticated User ID across all API endpoints, providing basic DDoS protection and preventing API abuse (especially on resource-heavy endpoints such as the Gemini-powered invoice parser).

### 6.4. CORS Policy (Cross-Origin Resource Sharing)
* **Default Restriction:** CORS is restricted to `same-origin` by default.
* **External Access:** Additional allowed origins must be explicitly configured via environment variables (e.g., `ALLOWED_ORIGINS`) in production and staging environments to prevent unauthorized cross-origin requests.

