import ExcelJS from 'exceljs'
import { ExportColumnDefinition } from 'src/types/voucher-export'

export const standardJurisdictions = [
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
]

export function getColumnLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ''
  while (temp > 0) {
    const modulo = (temp - 1) % 26
    letter = String.fromCharCode(65 + modulo) + letter
    temp = Math.floor((temp - modulo) / 26)
  }
  return letter
}

function formatExcelCell(cell: ExcelJS.Cell, column: ExportColumnDefinition) {
  if (column.isMonetary) {
    cell.numFmt = '"$"#,##0.00;("$"#,##0.00);"$0.00"'
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    return
  }
  if (column.isDate) {
    cell.numFmt = 'dd/mm/yyyy'
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    return
  }
  if (column.isRate) {
    cell.numFmt = '0.0000'
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    return
  }
  if (column.isCenter) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    return
  }
  if (column.isText) {
    cell.numFmt = '@'
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    return
  }
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
}

export function buildExcelWorkbook(
  titleText: string,
  companyName: string,
  companyCuit: string,
  subTitleText: string,
  columns: ExportColumnDefinition[],
  data: Record<string, unknown>[]
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(titleText)

  sheet.views = [{ showGridLines: true }]

  sheet.getRow(1).getCell(1).value = titleText
  sheet.getRow(1).getCell(1).font = { bold: true, name: 'Segoe UI', size: 16 }

  sheet.getRow(2).getCell(1).value = `Empresa: ${companyName}`
  sheet.getRow(2).getCell(1).font = { name: 'Segoe UI', size: 11 }

  sheet.getRow(3).getCell(1).value = `CUIT: ${companyCuit}`
  sheet.getRow(3).getCell(1).font = { name: 'Segoe UI', size: 11 }

  sheet.getRow(4).getCell(1).value = subTitleText
  sheet.getRow(4).getCell(1).font = { name: 'Segoe UI', size: 11 }

  const headerRow = sheet.getRow(6)
  headerRow.values = columns.map((c) => c.header)
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Segoe UI', size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25

function getExcelColumnLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ''
  while (temp > 0) {
    const modulo = (temp - 1) % 26
    letter = String.fromCharCode(65 + modulo) + letter
    temp = Math.floor((temp - modulo) / 26)
  }
  return letter
}

  data.forEach((rowData, idx) => {
    const row = sheet.getRow(7 + idx)
    row.values = columns.map((c) => rowData[c.key] as ExcelJS.CellValue)
    row.font = { name: 'Segoe UI', size: 10 }
    row.alignment = { vertical: 'middle' }

    columns.forEach((c, cIdx) => {
      formatExcelCell(row.getCell(cIdx + 1), c)
    })

    const totalColIdx = columns.findIndex((c) => c.key === 'total') + 1
    const subtotalColIdx = columns.findIndex((c) => c.key === 'subtotal') + 1
    const hasTotalFormula = totalColIdx > 0 && subtotalColIdx > 0
    if (hasTotalFormula) {
      const firstColLetter = getExcelColumnLetter(subtotalColIdx)
      const lastColLetter = getExcelColumnLetter(totalColIdx - 1)
      const rowNum = 7 + idx
      row.getCell(totalColIdx).value = {
        formula: `SUM(${firstColLetter}${rowNum}:${lastColLetter}${rowNum})`,
        result: rowData.total as number,
      }
    }
  })

  const totalRowIndex = 7 + data.length
  const totalRow = sheet.getRow(totalRowIndex)
  totalRow.font = { bold: true, name: 'Segoe UI', size: 11 }
  totalRow.height = 22
  totalRow.getCell(1).value = 'TOTALES'

  const borderStyle = {
    top: { style: 'thin' as const },
    bottom: { style: 'double' as const },
  }

  const startRow = 7
  const endRow = data.length > 0 ? 6 + data.length : 7

  columns.forEach((c, cIdx) => {
    const cell = totalRow.getCell(cIdx + 1)
    cell.border = borderStyle
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' },
    }

    if (c.isMonetary) {
      const colLetter = getColumnLetter(cIdx + 1)
      cell.value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` }
      cell.numFmt = '"$"#,##0.00;("$"#,##0.00);"$0.00"'
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
    } else if (cIdx > 0) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle' }
    }
  })

  sheet.columns.forEach((column) => {
    let maxLen = 0
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value
      if (val) {
        let len = 0
        if (typeof val === 'object' && 'formula' in val) {
          len = 10
        } else if (val instanceof Date) {
          len = 10
        } else {
          len = val.toString().length
        }
        if (len > maxLen) {
          maxLen = len
        }
      }
    })
    column.width = Math.max(maxLen + 3, 10)
  })

  return workbook
}
