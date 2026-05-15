import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const supabase = createServiceClient()
  let query = supabase
    .from("reservations")
    .select(`*, tables(id, label)`)
    .order("datetime")

  if (status) query = query.eq("status", status)
  if (from) query = query.gte("datetime", from)
  if (to) query = query.lte("datetime", to)

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("reservations")
    .insert(body)
    .select(`*, tables(id, label)`)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
