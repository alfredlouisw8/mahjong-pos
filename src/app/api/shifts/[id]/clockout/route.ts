import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireCashier } from "@/lib/auth/guards"
import { cookies } from "next/headers"

export async function POST(_req: NextRequest, ctx: DynContext<"/api/shifts/[id]/clockout">) {
  const { error, payload } = await requireCashier()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  await supabase
    .from("shift_employees")
    .update({ left_at: now })
    .eq("shift_id", id)
    .eq("cashier_id", payload!.cashierId)
    .is("left_at", null)

  const { data: remaining } = await supabase
    .from("shift_employees")
    .select("id")
    .eq("shift_id", id)
    .is("left_at", null)

  const cookieStore = await cookies()
  cookieStore.delete("cashier_token")

  return NextResponse.json({ ok: true, isLastEmployee: !remaining?.length })
}
