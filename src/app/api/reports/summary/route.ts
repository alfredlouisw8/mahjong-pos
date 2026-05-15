import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"
import type { ReportSummary } from "@/types/api"

export async function GET(request: NextRequest) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]

  const supabase = createServiceClient()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("table_charge, start_time, end_time")
    .eq("status", "closed")
    .gte("end_time", `${from}T00:00:00`)
    .lte("end_time", `${to}T23:59:59`)

  const { data: orders } = await supabase
    .from("orders")
    .select("unit_price, unit_cogs, quantity, session_id")
    .eq("status", "confirmed")
    .gte("created_at", `${from}T00:00:00`)
    .lte("created_at", `${to}T23:59:59`)

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .gte("date", from)
    .lte("date", to)

  const tableIncome = sessions?.reduce((sum, s) => sum + (s.table_charge ?? 0), 0) ?? 0
  const fbIncome = orders?.reduce((sum, o) => sum + o.unit_price * o.quantity, 0) ?? 0
  const fbCogs = orders?.reduce((sum, o) => sum + o.unit_cogs * o.quantity, 0) ?? 0
  const totalRevenue = tableIncome + fbIncome
  const grossProfit = totalRevenue - fbCogs
  const operatingExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  const netProfit = grossProfit - operatingExpenses
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const sessionCount = sessions?.length ?? 0
  const tableHours = sessions?.reduce((sum, s) => {
    if (!s.end_time) return sum
    return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3_600_000
  }, 0) ?? 0

  const summary: ReportSummary = {
    totalRevenue,
    tableIncome,
    fbIncome,
    fbCogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    netMargin,
    sessionCount,
    tableHours: Math.round(tableHours * 10) / 10,
    avgRevenuePerSession: sessionCount > 0 ? totalRevenue / sessionCount : 0,
  }

  return NextResponse.json(summary)
}
