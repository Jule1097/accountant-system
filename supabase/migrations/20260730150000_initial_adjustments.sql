-- 1. Custom Partial Unique Indexes for Duplicate Voucher Prevention
CREATE UNIQUE INDEX IF NOT EXISTS voucher_unique_sale_idx ON "Voucher" (
  "companyId", 
  "type", 
  "clientId", 
  "voucherTypeId", 
  "voucherLetterId", 
  "posNumber", 
  "number"
) 
WHERE "type" = 'sale' AND "clientId" IS NOT NULL AND "supplierId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS voucher_unique_purchase_idx ON "Voucher" (
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
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCompany" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Voucher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoucherRetention" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoucherVatDetail" ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for Multi-Tenant Isolation

-- UserCompany: Users can access their own company links
CREATE POLICY user_company_self_policy ON "UserCompany"
  FOR ALL
  TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Company: A user can access a company's data only if associated via UserCompany
CREATE POLICY company_access_policy ON "Company"
  FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT "companyId" FROM "UserCompany" WHERE "userId" = auth.uid()
    )
  );

-- Client: Access restricted to companies the user is associated with
CREATE POLICY client_access_policy ON "Client"
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

-- Supplier: Access restricted to companies the user is associated with
CREATE POLICY supplier_access_policy ON "Supplier"
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

-- Voucher: Access restricted to companies the user is associated with
CREATE POLICY voucher_access_policy ON "Voucher"
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

-- VoucherRetention: Access restricted to vouchers belonging to user's companies
CREATE POLICY voucher_retention_access_policy ON "VoucherRetention"
  FOR ALL
  TO authenticated
  USING (
    "voucherId" IN (
      SELECT v.id FROM "Voucher" v
      JOIN "UserCompany" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  )
  WITH CHECK (
    "voucherId" IN (
      SELECT v.id FROM "Voucher" v
      JOIN "UserCompany" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  );

-- VoucherVatDetail: Access restricted to vouchers belonging to user's companies
CREATE POLICY voucher_vat_detail_access_policy ON "VoucherVatDetail"
  FOR ALL
  TO authenticated
  USING (
    "voucherId" IN (
      SELECT v.id FROM "Voucher" v
      JOIN "UserCompany" uc ON v."companyId" = uc."companyId"
      WHERE uc."userId" = auth.uid()
    )
  )
  WITH CHECK (
    "voucherId" IN (
      SELECT v.id FROM "Voucher" v
      JOIN "UserCompany" uc ON v."companyId" = uc."companyId"
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
  INSERT INTO public."User" (id, email, "createdAt", "updatedAt")
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
