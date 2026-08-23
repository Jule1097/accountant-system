import Decimal from 'decimal.js'
import { Voucher } from 'src/models/Voucher'
import { getPreviousMonthRangeInArgentina } from './date-timezone'
import { standardJurisdictions } from './excel-builder'
import { normalizeCuit } from 'src/lib/cuit'
import { resolveTaxJurisdictionName } from 'src/lib/tax-jurisdictions'
import {
  ExportColumnDefinition,
  ExportQueryParams,
  RetentionConceptLike,
  PerceptionConceptLike,
  VatRateLike,
} from 'src/types/voucher-export'
import { VoucherFilterParams } from 'src/types/voucher'

export function buildExportFilters(params: ExportQueryParams): {
  filters: VoucherFilterParams
  periodString: string
} {
  const filters: VoucherFilterParams = {
    type: params.type === 'sales' ? 'sale' : 'purchase',
  }
  let periodString = ''

  const isDeclaration = params.mode === 'declaration'
  if (isDeclaration) {
    const range = getPreviousMonthRangeInArgentina()
    filters.dateFrom = range.dateFrom
    filters.dateTo = range.dateTo
    filters.sortBy = 'date'
    filters.sortOrder = 'asc'
    periodString = range.periodString
    return { filters, periodString }
  }

  filters.search = params.search || undefined
  filters.status = params.status || undefined
  filters.dateFrom = params.dateFrom
  filters.dateTo = params.dateTo
  filters.sortBy = params.sortBy
  filters.sortOrder = params.sortOrder
  return { filters, periodString }
}

export function cleanHeaderName(name: string, category: 'ret' | 'perc'): string {
  let clean = name
    .replace(/Retención de /i, 'Ret. ')
    .replace(/Retención /i, 'Ret. ')
    .replace(/Percepción de /i, 'Perc. ')
    .replace(/Percepción /i, 'Perc. ')
    .replace(/ Sufrida/i, '')
    .replace(/ Sufrido/i, '')

  const lowercase = name.toLowerCase()
  const isRet = category === 'ret'
  
  if (isRet && lowercase.includes('ganancias')) clean = 'Ret. Ganancias'
  if (isRet && lowercase.includes('iva')) clean = 'Ret. IVA'
  if (isRet && lowercase.includes('osseg')) clean = 'Ret. OSSEG'

  const isPerc = category === 'perc'
  if (isPerc && lowercase.includes('ganancias')) clean = 'Perc. Ganancias'
  if (isPerc && lowercase.includes('iva')) clean = 'Perc. IVA'
  if (isPerc && lowercase.includes('osseg')) clean = 'Perc. OSSEG'

  return clean
}

export function mapSalesVoucherToRow(
  voucher: Voucher,
  saleConcepts: RetentionConceptLike[]
): Record<string, unknown> {
  const isLetterC = voucher.voucherLetter?.letter === 'C'
  const subtotal = isLetterC ? 0 : voucher.getSignedValueInArs(voucher.subtotal).toNumber()
  const exempt = isLetterC
    ? voucher.getSignedValueInArs(voucher.subtotal).plus(voucher.getSignedValueInArs(voucher.exemptAmount)).toNumber()
    : voucher.getSignedValueInArs(voucher.exemptAmount).toNumber()

  const row: Record<string, unknown> = {
    date: voucher.date,
    paymentDate: voucher.paymentDate || null,
    voucherType: voucher.voucherType?.name || '',
    letter: voucher.voucherLetter?.letter || '',
    posNumber: voucher.posNumber,
    number: voucher.number,
    clientName: voucher.client?.name || '',
    clientCuit: voucher.client?.cuit ? normalizeCuit(voucher.client.cuit) : '',
    currency: voucher.currency,
    exchangeRate: voucher.getExchangeRateDecimal().toNumber(),
    subtotal,
    nonTaxable: voucher.getSignedValueInArs(voucher.nonTaxableAmount).toNumber(),
    exempt,
    vat: voucher.getSignedValueInArs(voucher.vatAmount).toNumber(),
    total: voucher.getSignedValueInArs(voucher.totalAmount).toNumber(),
  }

  saleConcepts.forEach((c) => {
    row[`ret_concept_${c.id}`] = 0
  })

  standardJurisdictions.forEach((j) => {
    row[`ret_${j}`] = 0
  })

  let otrosRet = voucher.getSignedValueInArs(voucher.otherTaxesAmount)

  voucher.retentions.forEach((ret) => {
    const amount = voucher.getSignedValueInArs(ret.amount)
    const matchedConcept = saleConcepts.find((c) => c.id === ret.retentionConceptId)
    if (matchedConcept) {
      row[`ret_concept_${matchedConcept.id}`] = new Decimal((row[`ret_concept_${matchedConcept.id}`] as number) || 0)
        .add(amount)
        .toNumber()
      return
    }

    const resolvedName = resolveTaxJurisdictionName(ret.taxJurisdiction?.name)
    const isStandard = resolvedName && standardJurisdictions.includes(resolvedName)
    if (isStandard) {
      row[`ret_${resolvedName}`] = new Decimal((row[`ret_${resolvedName}`] as number) || 0).add(amount).toNumber()
      return
    }

    otrosRet = otrosRet.add(amount)
  })

  row.otherTaxes = otrosRet.toNumber()
  return row
}

export function mapPurchasesVoucherToRow(
  voucher: Voucher,
  allVatRates: VatRateLike[],
  activeVatRates: VatRateLike[],
  purchaseConcepts: PerceptionConceptLike[]
): Record<string, unknown> {
  const isLetterC = voucher.voucherLetter?.letter === 'C'
  const subtotal = isLetterC ? 0 : voucher.getSignedValueInArs(voucher.subtotal).toNumber()

  const row: Record<string, unknown> = {
    date: voucher.date,
    paymentDate: voucher.paymentDate || null,
    voucherType: voucher.voucherType?.name || '',
    letter: voucher.voucherLetter?.letter || '',
    posNumber: voucher.posNumber,
    number: voucher.number,
    supplierName: voucher.supplier?.name || '',
    supplierCuit: voucher.supplier?.cuit ? normalizeCuit(voucher.supplier.cuit) : '',
    currency: voucher.currency,
    exchangeRate: voucher.getExchangeRateDecimal().toNumber(),
    subtotal,
    total: voucher.getSignedValueInArs(voucher.totalAmount).toNumber(),
  }

  activeVatRates.forEach((vr) => {
    row[`iva_${vr.id}`] = 0
  })

  purchaseConcepts.forEach((c) => {
    row[`perc_concept_${c.id}`] = 0
  })

  standardJurisdictions.forEach((j) => {
    row[`perc_${j}`] = 0
  })

  let exempt = isLetterC
    ? voucher.getSignedValueInArs(voucher.subtotal).plus(voucher.getSignedValueInArs(voucher.exemptAmount))
    : voucher.getSignedValueInArs(voucher.exemptAmount)
  let nonTaxable = voucher.getSignedValueInArs(voucher.nonTaxableAmount)

  const shouldProcessVat = !isLetterC
  if (shouldProcessVat) {
    const hasVatDetails = voucher.vatDetails.length > 0
    if (hasVatDetails) {
      voucher.vatDetails.forEach((detail) => {
        const subtotalVal = voucher.getSignedValueInArs(detail.subtotal)
        const vat = voucher.getSignedValueInArs(detail.vatAmount)
        const vr = allVatRates.find((v) => v.id === detail.vatRateId)

        if (!vr) {
          return
        }
        if (vr.name === 'Exento') {
          exempt = exempt.add(subtotalVal)
          return
        }
        if (vr.name === 'No Gravado') {
          nonTaxable = nonTaxable.add(subtotalVal)
          return
        }
        if (vr.rate.toNumber() > 0) {
          row[`iva_${vr.id}`] = new Decimal((row[`iva_${vr.id}`] as number) || 0).add(vat).toNumber()
        }
      })
    }

    const hasNoVatDetails = voucher.vatDetails.length === 0
    if (hasNoVatDetails) {
      const hasVatAmount = new Decimal(voucher.vatAmount.toString()).gt(0)
      const hasSubtotal = new Decimal(voucher.subtotal.toString()).gt(0)
      const canInfer = hasVatAmount && hasSubtotal

      if (canInfer) {
        const effectiveRate = new Decimal(voucher.vatAmount.toString())
          .div(new Decimal(voucher.subtotal.toString()))
          .toNumber()

        const positiveVatRates = allVatRates.filter((vr) => vr.rate.toNumber() > 0)
        let closestVr = positiveVatRates[0]
        if (closestVr) {
          let minDiff = Math.abs(closestVr.rate.toNumber() - effectiveRate)
          positiveVatRates.forEach((vr) => {
            const diff = Math.abs(vr.rate.toNumber() - effectiveRate)
            if (diff < minDiff) {
              minDiff = diff
              closestVr = vr
            }
          })

          const vatVal = voucher.getSignedValueInArs(voucher.vatAmount)
          row[`iva_${closestVr.id}`] = vatVal.toNumber()
        }
      }

      const hasNoVatAndPositiveSubtotal = !hasVatAmount && hasSubtotal
      if (hasNoVatAndPositiveSubtotal) {
        exempt = exempt.add(voucher.getSignedValueInArs(voucher.subtotal))
      }
    }
  }

  row.exempt = exempt.toNumber()
  row.nonTaxable = nonTaxable.toNumber()

  let otrosPerc = voucher.getSignedValueInArs(voucher.otherTaxesAmount)

  voucher.perceptions.forEach((perc) => {
    const amount = voucher.getSignedValueInArs(perc.amount)
    const matchedConcept = purchaseConcepts.find((c) => c.id === perc.perceptionConceptId)
    if (matchedConcept) {
      row[`perc_concept_${matchedConcept.id}`] = new Decimal((row[`perc_concept_${matchedConcept.id}`] as number) || 0)
        .add(amount)
        .toNumber()
      return
    }

    const resolvedName = resolveTaxJurisdictionName(perc.taxJurisdiction?.name)
    const isStandard = resolvedName && standardJurisdictions.includes(resolvedName)
    if (isStandard) {
      row[`perc_${resolvedName}`] = new Decimal((row[`perc_${resolvedName}`] as number) || 0).add(amount).toNumber()
      return
    }

    otrosPerc = otrosPerc.add(amount)
  })

  row.otherPerceptions = otrosPerc.toNumber()
  return row
}

export function prepareExportWorkbookData(
  type: 'sales' | 'purchases',
  vouchers: Voucher[],
  catalogs: {
    allVatRates: VatRateLike[]
    allRetentionConcepts: RetentionConceptLike[]
    allPerceptionConcepts: PerceptionConceptLike[]
  }
): {
  columns: ExportColumnDefinition[]
  data: Record<string, unknown>[]
} {
  const isSales = type === 'sales'
  if (isSales) {
    const saleConcepts = catalogs.allRetentionConcepts.filter(
      (c) => c.type === 'sale' && !c.name.toLowerCase().includes('ingresos brutos')
    )

    const dynamicRetentionColumns = saleConcepts.map((c) => ({
      header: cleanHeaderName(c.name, 'ret'),
      key: `ret_concept_${c.id}`,
      isMonetary: true,
    }))

    const columns: ExportColumnDefinition[] = [
      { header: 'Fecha', key: 'date', isDate: true },
      { header: 'Fecha Pago', key: 'paymentDate', isDate: true },
      { header: 'Tipo Comprobante', key: 'voucherType' },
      { header: 'Letra', key: 'letter', isCenter: true },
      { header: 'Punto Venta', key: 'posNumber', isText: true },
      { header: 'Número', key: 'number', isText: true },
      { header: 'Cliente', key: 'clientName' },
      { header: 'CUIT', key: 'clientCuit', isText: true },
      { header: 'Moneda', key: 'currency', isCenter: true },
      { header: 'Tipo de Cambio', key: 'exchangeRate', isRate: true },
      { header: 'Subtotal', key: 'subtotal', isMonetary: true },
      { header: 'No Gravado', key: 'nonTaxable', isMonetary: true },
      { header: 'Exento', key: 'exempt', isMonetary: true },
      { header: 'IVA', key: 'vat', isMonetary: true },
      ...dynamicRetentionColumns,
      ...standardJurisdictions.map((j) => ({
        header: `Ret IIBB ${j === 'Buenos Aires' ? 'PBA' : j}`,
        key: `ret_${j}`,
        isMonetary: true,
      })),
      { header: 'Otros Impuestos', key: 'otherTaxes', isMonetary: true },
      { header: 'Total', key: 'total', isMonetary: true },
    ]

    const data = vouchers.map((v) => mapSalesVoucherToRow(v, saleConcepts))

    return { columns, data }
  }

  const activeVatRates = catalogs.allVatRates.filter((vr) => new Decimal(vr.rate.toString()).gt(0))
  const purchaseConcepts = catalogs.allPerceptionConcepts.filter(
    (c) => !c.name.toLowerCase().includes('ingresos brutos')
  )

  const dynamicPerceptionColumns = purchaseConcepts.map((c) => ({
    header: cleanHeaderName(c.name, 'perc'),
    key: `perc_concept_${c.id}`,
    isMonetary: true,
  }))

  const columns: ExportColumnDefinition[] = [
    { header: 'Fecha', key: 'date', isDate: true },
    { header: 'Fecha Pago', key: 'paymentDate', isDate: true },
    { header: 'Tipo Comprobante', key: 'voucherType' },
    { header: 'Letra', key: 'letter', isCenter: true },
    { header: 'Punto Venta', key: 'posNumber', isText: true },
    { header: 'Número', key: 'number', isText: true },
    { header: 'Proveedor', key: 'supplierName' },
    { header: 'CUIT', key: 'supplierCuit', isText: true },
    { header: 'Moneda', key: 'currency', isCenter: true },
    { header: 'Tipo de Cambio', key: 'exchangeRate', isRate: true },
    { header: 'Subtotal', key: 'subtotal', isMonetary: true },
    ...activeVatRates.map((vr) => ({
      header: `IVA ${vr.name}`,
      key: `iva_${vr.id}`,
      isMonetary: true,
    })),
    { header: 'Exento', key: 'exempt', isMonetary: true },
    { header: 'No Gravado', key: 'nonTaxable', isMonetary: true },
    ...dynamicPerceptionColumns,
    ...standardJurisdictions.map((j) => ({
      header: `Perc IIBB ${j === 'Buenos Aires' ? 'PBA' : j}`,
      key: `perc_${j}`,
      isMonetary: true,
    })),
    { header: 'Otros', key: 'otherPerceptions', isMonetary: true },
    { header: 'Total', key: 'total', isMonetary: true },
  ]

  const data = vouchers.map((v) =>
    mapPurchasesVoucherToRow(v, catalogs.allVatRates, activeVatRates, purchaseConcepts)
  )

  return { columns, data }
}

export function generateExportFilename(
  params: ExportQueryParams,
  companyName: string,
  periodString: string
): string {
  const sanitizedCompanyName = companyName.replace(/\s+/g, '_')
  const today = new Date().toISOString().split('T')[0]
  const isDeclaration = params.mode === 'declaration'
  const prefix = params.type === 'sales' ? 'Ventas' : 'Compras'

  if (isDeclaration) {
    return `${prefix}_${sanitizedCompanyName}_Libro_IVA_${periodString}.xlsx`
  }

  return `${prefix}_${sanitizedCompanyName}_Filtrado_${today}.xlsx`
}
