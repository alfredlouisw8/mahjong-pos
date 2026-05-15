import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"
import { buildCSV } from "@/lib/csv"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]

  const supabase = createServiceClient()
  const { data } = await supabase
    .from("sessions")
    .select(`*, tables(label), cashiers:opened_by(name)`)
    .eq("status", "closed")
    .gte("end_time", `${from}T00:00:00`)
    .lte("end_time", `${to}T23:59:59`)
    .order("end_time")

  const headers = [
    "Session ID", "Date", "Table", "Cashier", "Billing Mode",
    "Start Time", "End Time", "Blocks", "Hourly Rate", "Table Charge",
  ]

  const rows = (data ?? []).map((s) => [
    s.id,
    s.end_time?.split("T")[0],
    (s.tables as any)?.label,
    (s.cashiers as any)?.name,
    s.billing_mode,
    s.start_time,
    s.end_time,
    s.blocks_purchased,
    s.hourly_rate,
    s.table_charge,
  ])

  const csv = buildCSV(headers, rows)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sessions-${from}-${to}.csv"`,
    },
  })
}
