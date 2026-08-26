export interface MonthRange {
  dateFrom: Date
  dateTo: Date
  periodString: string
}

export function getPreviousMonthRangeInArgentina(): MonthRange {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = formatter.formatToParts(now)
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const year = parseInt(partMap.year, 10)
  const month = parseInt(partMap.month, 10)

  let prevMonth = month - 1
  let prevYear = year
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  const prevMonthStr = String(prevMonth).padStart(2, '0')
  const lastDay = new Date(prevYear, prevMonth, 0).getDate()
  const lastDayStr = String(lastDay).padStart(2, '0')

  const dateFrom = new Date(`${prevYear}-${prevMonthStr}-01T00:00:00-03:00`)
  const dateTo = new Date(`${prevYear}-${prevMonthStr}-${lastDayStr}T23:59:59.999-03:00`)
  const periodString = `${prevMonthStr}-${prevYear}`

  return { dateFrom, dateTo, periodString }
}
