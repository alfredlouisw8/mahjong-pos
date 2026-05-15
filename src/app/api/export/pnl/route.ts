import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { buildCSV } from "@/lib/csv"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const summaryRes = await fetch(`${baseUrl}/api/reports/summary?from=${from}&to=${to}`)
  const summary = await summaryRes.json()

  const rows = [
    ["Metric", "Value"],
    ["Period", `${from} to ${to}`],
    ["Total Revenue", summary.totalRevenue],
    ["Table Income", summary.tableIncome],
    ["F&B Income", summary.fbIncome],
    ["F&B COGS", summary.fbCogs],
    ["Gross Profit", summary.grossProfit],
    ["Operating Expenses", summary.operatingExpenses],
    ["Net Profit", summary.netProfit],
    ["Net Margin %", `${summary.netMargin?.toFixed(1)}%`],
    ["Sessions", summary.sessionCount],
    ["Table Hours", summary.tableHours],
  ]

  const csv = buildCSV(["Metric", "Value"], rows.slice(1))

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pnl-${from}-${to}.csv"`,
    },
  })
}
