import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'
import { getCurrentTaxJurisdictionNames } from '../src/lib/tax-jurisdictions'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding catalogs and demo companies...')

  const companies = [
    { name: 'TEEM', cuit: '30-71761812-9' },
    { name: 'GRIB', cuit: '30-71761409-3' },
  ]

  for (const company of companies) {
    await prisma.company.upsert({
      where: { name: company.name },
      update: { cuit: company.cuit },
      create: { name: company.name, cuit: company.cuit },
    })
  }

  console.log('Companies seeded.')

  const vatRates = [
    { name: '21%', rate: 0.21 },
    { name: '10.5%', rate: 0.105 },
    { name: '27%', rate: 0.27 },
    { name: '5%', rate: 0.05 },
    { name: '3%', rate: 0.03 },
    { name: '2.5%', rate: 0.025 },
    { name: 'Exento', rate: 0.0 },
    { name: 'No Gravado', rate: 0.0 },
  ]

  for (const vatRate of vatRates) {
    await prisma.vatRate.upsert({
      where: { name: vatRate.name },
      update: { rate: vatRate.rate },
      create: { name: vatRate.name, rate: vatRate.rate },
    })
  }

  console.log('VAT rates seeded.')

  const voucherTypes = [
    { name: 'Factura' },
    { name: 'Nota de Débito' },
    { name: 'Nota de Crédito' },
    { name: 'Recibo' },
    { name: 'Factura de Crédito Electrónica MiPyME' },
  ]

  for (const voucherType of voucherTypes) {
    await prisma.voucherType.upsert({
      where: { name: voucherType.name },
      update: {},
      create: { name: voucherType.name },
    })
  }

  console.log('Voucher types seeded.')

  const voucherLetters = [
    { letter: 'A' },
    { letter: 'B' },
    { letter: 'C' },
    { letter: 'M' },
    { letter: 'E' },
  ]

  for (const voucherLetter of voucherLetters) {
    await prisma.voucherLetter.upsert({
      where: { letter: voucherLetter.letter },
      update: {},
      create: { letter: voucherLetter.letter },
    })
  }

  console.log('Voucher letters seeded.')

  const retentionConcepts = [
    { name: 'Retención de Ganancias Sufrida', type: 'sale' },
    { name: 'Retención de IVA Sufrida', type: 'sale' },
    { name: 'Retención de Ingresos Brutos Sufrida', type: 'sale' },
    { name: 'Retención Osseg/ansal Sufrida', type: 'sale' },
  ]

  for (const retentionConcept of retentionConcepts) {
    await prisma.retentionConcept.upsert({
      where: { name: retentionConcept.name },
      update: { type: retentionConcept.type },
      create: { name: retentionConcept.name, type: retentionConcept.type },
    })
  }

  console.log('Retention concepts seeded.')

  const perceptionConcepts = [
    { name: 'Percepción de IVA' },
    { name: 'Percepción de Ingresos Brutos' },
    { name: 'Percepción Osseg/ansal' },
  ]

  for (const perceptionConcept of perceptionConcepts) {
    await prisma.perceptionConcept.upsert({
      where: { name: perceptionConcept.name },
      update: {},
      create: { name: perceptionConcept.name },
    })
  }

  console.log('Perception concepts seeded.')

  for (const jurisdictionName of getCurrentTaxJurisdictionNames()) {
    await prisma.taxJurisdiction.upsert({
      where: { name: jurisdictionName },
      update: {},
      create: { name: jurisdictionName },
    })
  }

  console.log('Tax jurisdictions seeded.')
  console.log('Database seeding successfully completed!')
}

main()
  .catch((error) => {
    console.error('Error during database seeding:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
