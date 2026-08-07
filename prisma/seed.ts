import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding catalogs and demo companies...')

  // 1. Demo Companies
  const companies = [
    { name: 'TEEM', cuit: '30-71761812-9' },
    { name: 'GRIB', cuit: '30-71761409-3' },
  ]
  for (const c of companies) {
    await prisma.company.upsert({
      where: { name: c.name },
      update: { cuit: c.cuit },
      create: { name: c.name, cuit: c.cuit },
    })
  }
  console.log('Companies seeded.')

  // 2. VatRates
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
  for (const vr of vatRates) {
    await prisma.vatRate.upsert({
      where: { name: vr.name },
      update: { rate: vr.rate },
      create: { name: vr.name, rate: vr.rate },
    })
  }
  console.log('VAT rates seeded.')

  // 3. VoucherTypes
  const voucherTypes = [
    { name: 'Factura' },
    { name: 'Nota de Débito' },
    { name: 'Nota de Crédito' },
    { name: 'Recibo' },
    { name: 'Factura de Crédito Electrónica MiPyME' },
  ]
  for (const vt of voucherTypes) {
    await prisma.voucherType.upsert({
      where: { name: vt.name },
      update: {},
      create: { name: vt.name },
    })
  }
  console.log('Voucher types seeded.')

  // 4. VoucherLetters
  const voucherLetters = [
    { letter: 'A' },
    { letter: 'B' },
    { letter: 'C' },
    { letter: 'M' },
    { letter: 'E' },
  ]
  for (const vl of voucherLetters) {
    await prisma.voucherLetter.upsert({
      where: { letter: vl.letter },
      update: {},
      create: { letter: vl.letter },
    })
  }
  console.log('Voucher letters seeded.')

  // 5. RetentionConcepts
  const retentionConcepts = [
    // Sales (Ventas)
    { name: 'Retención de Ganancias Sufrida', type: 'sale' },
    { name: 'Retención de IVA Sufrida', type: 'sale' },
    { name: 'Retención de Ingresos Brutos Sufrida', type: 'sale' },
    { name: 'Retención Osseg/ansal Sufrida', type: 'sale' },
    // Purchases (Compras)
    { name: 'Retención de Ganancias', type: 'purchase' },
    { name: 'Retención de IVA', type: 'purchase' },
    { name: 'Percepción de IVA', type: 'purchase' },
    { name: 'Retención de Ingresos Brutos', type: 'purchase' },
    { name: 'Percepción de Ingresos Brutos', type: 'purchase' },
    { name: 'Otros Impuestos', type: 'purchase' },
  ]
  for (const rc of retentionConcepts) {
    await prisma.retentionConcept.upsert({
      where: { name: rc.name },
      update: { type: rc.type },
      create: { name: rc.name, type: rc.type },
    })
  }
  console.log('Retention concepts seeded.')

  console.log('Database seeding successfully completed!')
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
