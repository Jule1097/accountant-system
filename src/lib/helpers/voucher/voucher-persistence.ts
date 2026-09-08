import { voucherCreditNoteNameTokens, voucherExchangeRateScale, voucherMoneyScale, voucherStatusValues, voucherTypeCategories } from "src/lib/constants/voucher"
import { normalizeMoneyAmount, normalizeScaledDecimal } from "src/lib/helpers/voucher/money"
import { Voucher } from "src/models/voucher/Voucher"
import { VoucherDomainStatus, VoucherFactoryInput, VoucherTypeCategory } from "src/types/voucher/domain"
import { VoucherPersistenceRecord } from "src/types/voucher/voucher-persistence"
import { Prisma } from "src/generated/prisma/client"

function decimalValue(value: { toString(): string } | null, scale: number): string | null {
  return value ? normalizeScaledDecimal(value.toString(), scale) : null
}

function normalizeVoucherStatus(status: string): VoucherDomainStatus | null {
  if (status === voucherStatusValues.pending) return voucherStatusValues.pending
  if (status === voucherStatusValues.partial) return voucherStatusValues.partial
  if (status === voucherStatusValues.paid) return voucherStatusValues.paid
  return null
}

function resolveVoucherTypeCategory(name: string): VoucherTypeCategory {
  const normalizedName = name.toLowerCase()
  return voucherCreditNoteNameTokens.some((token) => normalizedName.includes(token)) ? voucherTypeCategories.creditNote : voucherTypeCategories.standard
}

function mapVoucherPersistenceRecord(record: VoucherPersistenceRecord): VoucherFactoryInput {
  const { retentions, perceptions, vatDetails, voucherType, voucherLetter, client, supplier, date, accountingPeriod, paymentDate, ...scalarFields } = record
  return {
    ...scalarFields,
    status: normalizeVoucherStatus(record.status),
    voucherTypeCategory: resolveVoucherTypeCategory(voucherType.name),
    date: date.toISOString(),
    accountingPeriod: accountingPeriod.toISOString(),
    paymentDate: paymentDate?.toISOString() ?? null,
    exchangeRate: normalizeScaledDecimal(record.exchangeRate.toString(), voucherExchangeRateScale),
    subtotal: normalizeMoneyAmount(record.subtotal.toString()),
    vatAmount: normalizeMoneyAmount(record.vatAmount.toString()),
    nonTaxableAmount: decimalValue(record.nonTaxableAmount, voucherMoneyScale),
    exemptAmount: decimalValue(record.exemptAmount, voucherMoneyScale),
    otherTaxesAmount: decimalValue(record.otherTaxesAmount, voucherMoneyScale),
    totalAmount: decimalValue(record.totalAmount, voucherMoneyScale),
    netAmount: decimalValue(record.netAmount, voucherMoneyScale),
    paidAmount: decimalValue(record.paidAmount, voucherMoneyScale),
    voucherTypeName: voucherType.name,
    voucherLetter: voucherLetter.letter,
    client,
    supplier,
    retentions: retentions.map((item) => ({ retentionConceptId: item.retentionConceptId, taxJurisdictionId: item.taxJurisdictionId, amount: normalizeMoneyAmount(item.amount.toString()), conceptName: item.retentionConcept.name, taxJurisdictionName: item.taxJurisdiction?.name ?? null })),
    perceptions: perceptions.map((item) => ({ perceptionConceptId: item.perceptionConceptId, taxJurisdictionId: item.taxJurisdictionId, amount: normalizeMoneyAmount(item.amount.toString()), conceptName: item.perceptionConcept.name, taxJurisdictionName: item.taxJurisdiction?.name ?? null })),
    vatDetails: vatDetails.map((item) => ({ vatRateId: item.vatRateId, subtotal: normalizeMoneyAmount(item.subtotal.toString()), vatAmount: normalizeMoneyAmount(item.vatAmount.toString()), vatRateName: item.vatRate.name })),
  }
}

export function mapPrismaVoucherToDomainInput(record: VoucherPersistenceRecord): VoucherFactoryInput {
  return mapVoucherPersistenceRecord(record)
}

export function mapVoucherToPrismaData(voucher: Voucher): Prisma.VoucherUncheckedCreateInput {
  const snapshot = voucher.toSnapshot()
  const { clientId, supplierId } = voucher.getPersistenceData()
  return {
    id: snapshot.id,
    companyId: snapshot.companyId,
    type: snapshot.type,
    voucherTypeId: snapshot.voucherTypeId,
    voucherLetterId: snapshot.voucherLetterId,
    posNumber: snapshot.posNumber,
    number: snapshot.number,
    clientId,
    supplierId,
    date: new Date(snapshot.date),
    accountingPeriod: new Date(snapshot.accountingPeriod),
    currency: snapshot.currency,
    exchangeRate: snapshot.exchangeRate,
    subtotal: snapshot.subtotal,
    vatAmount: snapshot.vatAmount,
    nonTaxableAmount: snapshot.nonTaxableAmount,
    exemptAmount: snapshot.exemptAmount,
    otherTaxesAmount: snapshot.otherTaxesAmount,
    totalAmount: snapshot.totalAmount,
    netAmount: snapshot.netAmount,
    concept: snapshot.concept,
    paymentMethod: voucher.paymentMethod ?? "",
    paymentDate: snapshot.paymentDate ? new Date(snapshot.paymentDate) : null,
    paidAmount: snapshot.paidAmount,
    status: snapshot.status,
    comments: snapshot.comments,
    createdByUserId: snapshot.createdByUserId,
  }
}
