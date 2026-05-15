import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireCashier } from "@/lib/auth/guards"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, ctx: DynContext<"/api/shifts/[id]/close">) {
  const { error } = await requireCashier()
  if (error) return error

  const { id } = await ctx.params
  const { closingCash, notes } = await request.json()
  const supabase = createServiceClient()

  const { data: shift } = await supabase.from("shifts").select("opening_cash").eq("id", id).single()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("table_charge")
    .eq("shift_id", id)
    .eq("status", "closed")

  const shiftRevenue = sessions?.reduce((sum, s) => sum + (s.table_charge ?? 0), 0) ?? 0
  const expectedCash = (shift?.opening_cash ?? 0) + shiftRevenue
  const cashVariance = closingCash - expectedCash

  await supabase
    .from("shifts")
    .update({
      status: "closed",
      end_time: new Date().toISOString(),
      closing_cash: closingCash,
      cash_variance: cashVariance,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  const cookieStore = await cookies()
  cookieStore.delete("cashier_token")

  return NextResponse.json({ ok: true, cashVariance })
}
