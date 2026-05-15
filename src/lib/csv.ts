function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCSV(headers: string[], rows: unknown[][]): string {
  const headerRow = headers.map(escapeCSV).join(",")
  const dataRows = rows.map((row) => row.map(escapeCSV).join(","))
  return [headerRow, ...dataRows].join("\r\n")
}
