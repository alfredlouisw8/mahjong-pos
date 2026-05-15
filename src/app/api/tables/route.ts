import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin, requireAnyStaff } from "@/lib/auth/guards"

export async function GET() {
  const { error } = await requireAnyStaff()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("tables")
    .select(`*, sessions!current_session_id(*)`)
    .eq("is_active", true)
    .order("sort_order")

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const { data: maxOrder } = await supabase
    .from("tables")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const { data, error: dbError } = await supabase
    .from("tables")
    .insert({
      label: body.label,
      notes: body.notes ?? null,
      sort_order: (maxOrder?.sort_order ?? 0) + 1,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
