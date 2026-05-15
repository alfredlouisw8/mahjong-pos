import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireCashier } from "@/lib/auth/guards"

export async function GET() {
  const { error, payload } = await requireCashier()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("shifts")
    .select(`*, shift_employees(*, cashiers(id, name))`)
    .eq("id", payload!.shiftId)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 })
  return NextResponse.json(data)
}
