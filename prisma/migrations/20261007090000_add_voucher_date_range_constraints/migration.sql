ALTER TABLE "voucher"
ADD CONSTRAINT "voucher_date_supported_range_check"
CHECK ("date" >= DATE '1900-01-01' AND "date" <= DATE '2100-12-31')
NOT VALID;

ALTER TABLE "voucher"
ADD CONSTRAINT "voucher_accounting_period_supported_range_check"
CHECK ("accountingPeriod" >= DATE '1900-01-01' AND "accountingPeriod" <= DATE '2100-12-31')
NOT VALID;

ALTER TABLE "voucher"
ADD CONSTRAINT "voucher_payment_date_supported_range_check"
CHECK ("paymentDate" IS NULL OR ("paymentDate" >= DATE '1900-01-01' AND "paymentDate" <= DATE '2100-12-31'))
NOT VALID;
