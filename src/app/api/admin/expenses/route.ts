import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const category = searchParams.get("category")

  const supabase = createServiceClient()
  let query = supabase.from("expenses").select("*").order("date", { ascending: false })

  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to)
  if (category) query = query.eq("category", category)

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase.from("expenses").insert(body).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
