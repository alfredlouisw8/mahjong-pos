import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? 1)
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = createServiceClient()
  const { data, error: dbError, count } = await supabase
    .from("shifts")
    .select(`*, shift_employees(*, cashiers(id, name))`, { count: "exact" })
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}
