import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function POST(request: NextRequest) {
  const { error, cashier } = await requireAnyStaff()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("receipts")
    .insert({
      session_id: body.sessionId,
      printed_by: cashier?.cashierId ?? null,
      snapshot: body.snapshot,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
