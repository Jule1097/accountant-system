-- 1. Custom Partial Unique Indexes for Duplicate Voucher Prevention
CREATE UNIQUE INDEX IF NOT EXISTS voucher_unique_sale_idx ON "voucher" (
  "companyId", 
  "type", 
  "clientId", 
  "voucherTypeId", 
  "voucherLetterId", 
  "posNumber", 
  "number"
) 
WHERE "type" = 'sale' AND "clientId" IS NOT NULL AND "supplierId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS voucher_unique_purchase_idx ON "voucher" (
  "companyId", 
  "type", 
  "supplierId", 
  "voucherTypeId", 
  "voucherLetterId", 
  "posNumber", 
  "number"
) 
WHERE "type" = 'purchase' AND "supplierId" IS NOT NULL AND "clientId" IS NULL;

-- 2. Enable Row Level Security (RLS) on all public tables
ALTER TABLE "company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "voucher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "voucher_retention" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "voucher_vat_detail" ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for Multi-Tenant Isolation

-- UserCompany: Users can access their own company links
CREATE POLICY user_company_self_policy ON "user_company"
  FOR ALL
  TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Company: A user can access a company's data only if associated via UserCompany
CREATE POLICY company_access_policy ON "company"
  FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  );

-- Client: Access restricted to companies the user is associated with
CREATE POLICY client_access_policy ON "client"
  FOR ALL
  TO authenticated
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  )
  WITH CHECK (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  );

-- Supplier: Access restricted to companies the user is associated with
CREATE POLICY supplier_access_policy ON "supplier"
  FOR ALL
  TO authenticated
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  )
  WITH CHECK (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  );

-- Voucher: Access restricted to companies the user is associated with
CREATE POLICY voucher_access_policy ON "voucher"
  FOR ALL
  TO authenticated
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  )
  WITH CHECK (
    "companyId" IN (
      SELECT "companyId" FROM "user_company" WHERE "userId" = auth.uid()
    )
  );

-- VoucherRetention: Access restricted to vouchers belonging to user's companies
CREATE POLICY voucher_retention_access_policy ON "voucher_retention"
  FOR ALL
  TO authenticated
  USING (
    "voucherId" IN (
      SELECT v.id FROM "voucher" v
      JOIN "user_company" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  )
  WITH CHECK (
    "voucherId" IN (
      SELECT v.id FROM "voucher" v
      JOIN "user_company" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  );

-- VoucherVatDetail: Access restricted to vouchers belonging to user's companies
CREATE POLICY voucher_vat_detail_access_policy ON "voucher_vat_detail"
  FOR ALL
  TO authenticated
  USING (
    "voucherId" IN (
      SELECT v.id FROM "voucher" v
      JOIN "user_company" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  )
  WITH CHECK (
    "voucherId" IN (
      SELECT v.id FROM "voucher" v
      JOIN "user_company" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  );

-- 4. User Synchronization Function and Trigger from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public."users" (id, email, "createdAt", "updatedAt")
  VALUES (
    new.id,
    new.email,
    new.created_at,
    new.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
