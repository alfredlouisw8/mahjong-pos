import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]
  const page = Number(searchParams.get("page") ?? 1)
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = createServiceClient()
  const { data, count, error: dbError } = await supabase
    .from("sessions")
    .select(`*, tables(label), cashiers:opened_by(name)`, { count: "exact" })
    .eq("status", "closed")
    .gte("end_time", `${from}T00:00:00`)
    .lte("end_time", `${to}T23:59:59`)
    .order("end_time", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}
