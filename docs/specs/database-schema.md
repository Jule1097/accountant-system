# Spec-Driven Development (SpecDD): Database Schema Setup

This specification defines the database architecture, constraints, validation schemas, and security isolation rules for the Accounting System, based on the specifications in [requirements.md](file:///d:/progra/accountant-system/requirements.md).

---

## 1. Objectives & Requirements
- Define all relational tables, types, fields, and indexes required for multi-tenant sales and purchase operations.
- Enforce strict business constraints directly at the database level where possible, or through application-level Zod schemas.
- Implement strict multi-tenant isolation so that users can only access vouchers belonging to companies they are associated with.
- Maintain a clean catalog seeding structure for VAT rates, voucher types, letters, and retention concepts.

---

## 2. Relational Database Design & Prisma Models

We will use standard PostgreSQL datatypes. For all currency and percentage/decimal values (such as `subtotal`, `vatAmount`, `totalAmount`, `netAmount`, `paidAmount`, `exchangeRate`, and `rate`), we will use the `Decimal` data type in Prisma (which maps to `numeric` in PostgreSQL) to prevent floating-point errors.

### 2.1. Prisma Schema Definition

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

// 1. Company
model Company {
  id        String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String        @unique @db.VarChar(255)
  cuit      String        @unique @db.VarChar(50)
  createdAt DateTime      @default(now()) @db.Timestamptz
  updatedAt DateTime      @updatedAt @db.Timestamptz
  
  // Relations
  users     UserCompany[]
  clients   Client[]
  suppliers Supplier[]
  vouchers  Voucher[]
}

// 2. User (Linked to Supabase auth.users.id)
model User {
  id        String        @id @db.Uuid
  email     String        @unique @db.VarChar(255)
  createdAt DateTime      @default(now()) @db.Timestamptz
  updatedAt DateTime      @updatedAt @db.Timestamptz
  
  // Relations
  companies UserCompany[]
  vouchers  Voucher[]
}

// 3. UserCompany (Many-to-Many intermediate table)
model UserCompany {
  userId    String   @db.Uuid
  companyId String   @db.Uuid
  createdAt DateTime @default(now()) @db.Timestamptz

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@id([userId, companyId])
}

// 4. Client
model Client {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String    @db.VarChar(255)
  cuit      String    @db.VarChar(50)
  companyId String    @db.Uuid
  createdAt DateTime  @default(now()) @db.Timestamptz
  updatedAt DateTime  @updatedAt @db.Timestamptz

  // Relations
  company   Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  vouchers  Voucher[]

  @@unique([companyId, cuit], name: "companyClientCuitUnique")
}

// 5. Supplier
model Supplier {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String    @db.VarChar(255)
  cuit      String    @db.VarChar(50)
  companyId String    @db.Uuid
  createdAt DateTime  @default(now()) @db.Timestamptz
  updatedAt DateTime  @updatedAt @db.Timestamptz

  // Relations
  company   Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  vouchers  Voucher[]

  @@unique([companyId, cuit], name: "companySupplierCuitUnique")
}

// 6. VoucherType (Catalog)
model VoucherType {
  id       String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name     String    @unique @db.VarChar(100)
  vouchers Voucher[]
}

// 7. VoucherLetter (Catalog)
model VoucherLetter {
  id       String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  letter   String    @unique @db.VarChar(10)
  vouchers Voucher[]
}

// 8. RetentionConcept (Catalog)
model RetentionConcept {
  id         String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String             @unique @db.VarChar(255)
  type       String             @db.VarChar(20) // 'sale' | 'purchase'
  retentions VoucherRetention[]
}

// 9. VatRate (Catalog)
model VatRate {
  id        String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String            @unique @db.VarChar(50) // e.g. '21%', '10.5%', 'Exento'
  rate      Decimal           @db.Decimal(5, 4)       // e.g. 0.2100, 0.1050, 0.0000
  details   VoucherVatDetail[]
}

// 10. Voucher
model Voucher {
  id                String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId         String             @db.Uuid
  type              String             @db.VarChar(20) // 'sale' | 'purchase'
  voucherTypeId     String             @db.Uuid
  voucherLetterId   String             @db.Uuid
  posNumber         String             @db.VarChar(5)  // padded to 5 digits, e.g. '00001'
  number            String             @db.VarChar(8)  // padded to 8 digits, e.g. '00000123'
  clientId          String?            @db.Uuid        // nullable, required if sale
  supplierId        String?            @db.Uuid        // nullable, required if purchase
  date              DateTime           @db.Date
  accountingPeriod  DateTime           @db.Date        // standardized to 1st day of month
  currency          String             @db.VarChar(10) // '$' | 'USD'
  exchangeRate      Decimal            @default(1.0000) @db.Decimal(12, 4) // defaults to 1 if $
  subtotal          Decimal            @db.Decimal(15, 2)
  vatAmount         Decimal            @db.Decimal(15, 2)
  totalAmount       Decimal            @db.Decimal(15, 2)
  netAmount         Decimal            @db.Decimal(15, 2) // liquid amount = totalAmount - Sum(retentions)
  concept           String?            @db.Text
  paymentMethod     String             @db.VarChar(100)
  status            String             @db.VarChar(20) // 'pending' | 'partial' | 'paid'
  paymentDate       DateTime?          @db.Date        // required if paidAmount > 0
  paidAmount        Decimal            @default(0.00) @db.Decimal(15, 2)
  comments          String?            @db.Text
  createdByUserId   String             @db.Uuid
  createdAt         DateTime           @default(now()) @db.Timestamptz
  updatedAt         DateTime           @updatedAt @db.Timestamptz

  // Relations
  company           Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  voucherType       VoucherType        @relation(fields: [voucherTypeId], references: [id])
  voucherLetter     VoucherLetter      @relation(fields: [voucherLetterId], references: [id])
  client            Client?            @relation(fields: [clientId], references: [id])
  supplier          Supplier?          @relation(fields: [supplierId], references: [id])
  createdByUser     User               @relation(fields: [createdByUserId], references: [id])
  retentions        VoucherRetention[]
  vatDetails        VoucherVatDetail[]

  // Note: Due to PostgreSQL treating NULL values as distinct, standard unique constraints
  // will allow duplicate records if either clientId or supplierId is NULL.
  // We will enforce strict uniqueness using two separate composite partial indexes in PostgreSQL.
}

// 11. VoucherRetention
model VoucherRetention {
  id                 String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  voucherId          String           @db.Uuid
  retentionConceptId String           @db.Uuid
  amount             Decimal          @db.Decimal(15, 2)
  province           String?          @db.VarChar(100) // jurisdiction filters (e.g. Ingresos Brutos)

  // Relations
  voucher            Voucher          @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  retentionConcept   RetentionConcept @relation(fields: [retentionConceptId], references: [id])
}

// 12. VoucherVatDetail
model VoucherVatDetail {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  voucherId String   @db.Uuid
  vatRateId String   @db.Uuid
  subtotal  Decimal  @db.Decimal(15, 2)
  vatAmount Decimal  @db.Decimal(15, 2)

  // Relations
  voucher   Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  vatRate   VatRate  @relation(fields: [vatRateId], references: [id])
}
```

---

## 3. Database-Level Unique Indexes & Constraints

Since we cannot write PostgreSQL partial indexes directly inside Prisma's `@unique` tag, we will execute a custom SQL script via Supabase CLI to apply the following indexes:

### 3.1. Unique Sales Vouchers (Client is NOT NULL, Supplier is NULL)
Ensures that for a specific company, we cannot duplicate sales invoices:
```sql
CREATE UNIQUE INDEX voucher_unique_sale_idx ON "Voucher" (
  "companyId", 
  "type", 
  "clientId", 
  "voucherTypeId", 
  "voucherLetterId", 
  "posNumber", 
  "number"
) 
WHERE "type" = 'sale' AND "clientId" IS NOT NULL AND "supplierId" IS NULL;
```

### 3.2. Unique Purchase Vouchers (Supplier is NOT NULL, Client is NULL)
Ensures that for a specific company, we cannot duplicate purchase invoices:
```sql
CREATE UNIQUE INDEX voucher_unique_purchase_idx ON "Voucher" (
  "companyId", 
  "type", 
  "supplierId", 
  "voucherTypeId", 
  "voucherLetterId", 
  "posNumber", 
  "number"
) 
WHERE "type" = 'purchase' AND "supplierId" IS NOT NULL AND "clientId" IS NULL;
```

---

## 4. Multi-Tenant Row Level Security (RLS) Policies

To ensure strict data isolation at the database layer (preventing data leaks if SQL commands run directly or via Data API), we will define RLS policies:

1. **Enable RLS on tables:** `Company`, `UserCompany`, `Client`, `Supplier`, `Voucher`, `VoucherRetention`, `VoucherVatDetail`.
2. **Access logic:**
   - A user can select/insert/update/delete on `Company` if they have a matching record in `UserCompany`.
   - A user can access/modify `Client`, `Supplier`, or `Voucher` if their `companyId` exists in the user's `UserCompany` associations:
     ```sql
     CREATE POLICY user_company_isolation_policy ON "Voucher"
     FOR ALL
     TO authenticated
     USING (
       "companyId" IN (
         SELECT "companyId" FROM "UserCompany" WHERE "userId" = auth.uid()
       )
     )
     WITH CHECK (
       "companyId" IN (
         SELECT "companyId" FROM "UserCompany" WHERE "userId" = auth.uid()
       )
     );
     ```

---

## 5. Catalog Seeding Plan

The seed script (`prisma/seed.ts`) will insert the default values for the catalogs. Since catalogs are shared globally, they will have fixed static UUID values or check for name existence.

### 5.1. VatRate
- `21%` (rate: 0.21)
- `10.5%` (rate: 0.105)
- `27%` (rate: 0.27)
- `5%` (rate: 0.05)
- `3%` (rate: 0.03)
- `2.5%` (rate: 0.025)
- `Exento` (rate: 0)
- `No Gravado` (rate: 0)

### 5.2. VoucherType
- `Factura`
- `Nota de Débito`
- `Nota de Crédito`
- `Recibo`
- `Factura de Crédito Electrónica MiPyME`

### 5.3. VoucherLetter
- `A`
- `B`
- `C`
- `M`
- `E`

### 5.4. RetentionConcept (Catalogs)

**Ventas (Sales) - Retenciones Sufridas:**
- `Retención de Ganancias Sufrida`
- `Retención de IVA Sufrida`
- `Retención de Ingresos Brutos Sufrida` (Supported jurisdictions: `CABA`, `PBA`, `Tucumán`, `Córdoba`, `La Pampa`, `Mendoza`, `Santa Fe`, `Misiones`, `Santa Cruz`, `Neuquén`, `Entre Ríos`)
- `Retención Osseg/ansal Sufrida`

**Compras (Purchases) - Retenciones/Percepciones Aplicadas:**
- `Retención de Ganancias`
- `Retención de IVA`
- `Percepción de IVA`
- `Retención de Ingresos Brutos` (Supported jurisdictions: `CABA`, `BUENOS AIRES`, `Córdoba`)
- `Percepción de Ingresos Brutos` (Supported jurisdictions: `CABA`, `BUENOS AIRES`, `Córdoba`)
- `Otros Impuestos`

---

## 6. Testing Plan

We will add a suite of Jest tests to verify:
1. **Model structure mapping:** Prisma client models type check successfully.
2. **Zod Validation schemas:** Checking edge cases such as:
   - Currency USD: Exchange rate must be > 0.
   - Currency ARS: Exchange rate defaults to 1.
   - PosNumber padding: Padding POS to 5 digits, number to 8 digits.
   - Sale: Client is required, Supplier is null.
   - Purchase: Supplier is required, Client is null.
