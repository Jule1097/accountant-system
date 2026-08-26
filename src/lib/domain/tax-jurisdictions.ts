const currentTaxJurisdictionNames = [
  'Buenos Aires',
  'CABA',
  'Cordoba',
  'Tucuman',
  'La Pampa',
  'Mendoza',
  'Santa Fe',
  'Misiones',
  'Santa Cruz',
  'Neuquen',
  'Entre Rios',
] as const

const taxJurisdictionAliases: Record<string, (typeof currentTaxJurisdictionNames)[number]> = {
  'buenos aires': 'Buenos Aires',
  'pba': 'Buenos Aires',
  'caba': 'CABA',
  'ciudad autonoma de buenos aires': 'CABA',
  'cordoba': 'Cordoba',
  'cordoba capital': 'Cordoba',
  'tucuman': 'Tucuman',
  'la pampa': 'La Pampa',
  'mendoza': 'Mendoza',
  'santa fe': 'Santa Fe',
  'misiones': 'Misiones',
  'santa cruz': 'Santa Cruz',
  'neuquen': 'Neuquen',
  'entre rios': 'Entre Rios',
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function getCurrentTaxJurisdictionNames(): string[] {
  return [...currentTaxJurisdictionNames]
}

export function resolveTaxJurisdictionName(value?: string | null): string | null {
  if (!value) {
    return null
  }

  const normalizedValue = normalizeValue(value)
  return taxJurisdictionAliases[normalizedValue] || null
}
