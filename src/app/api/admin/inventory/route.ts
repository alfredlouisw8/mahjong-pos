import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("inventory_items")
    .select("*")
    .order("name")

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("inventory_items")
    .insert(body)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
