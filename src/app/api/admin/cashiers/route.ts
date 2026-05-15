import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"
import bcrypt from "bcryptjs"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("cashiers")
    .select("id, name, is_active, created_at")
    .order("name")

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { name, pin } = await request.json()
  const supabase = createServiceClient()

  const pinHash = pin ? await bcrypt.hash(pin, 12) : null

  const { data, error: dbError } = await supabase
    .from("cashiers")
    .insert({ name, pin_hash: pinHash })
    .select("id, name, is_active, created_at")
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
