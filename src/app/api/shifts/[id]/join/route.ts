import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireCashier } from "@/lib/auth/guards"
import { cookies } from "next/headers"
import { signCashierToken } from "@/lib/auth/cashier"

export async function POST(request: NextRequest, ctx: DynContext<"/api/shifts/[id]/join">) {
  const { error } = await requireCashier()
  if (error) return error

  const { id } = await ctx.params
  const { cashierId } = await request.json()
  const supabase = createServiceClient()

  const { error: insertError } = await supabase.from("shift_employees").insert({
    shift_id: id,
    cashier_id: cashierId,
  })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const { data: cashier } = await supabase.from("cashiers").select("name").eq("id", cashierId).single()

  const token = signCashierToken({
    cashierId,
    cashierName: cashier?.name ?? "",
    shiftId: id,
  })

  const cookieStore = await cookies()
  cookieStore.set("cashier_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  })

  return NextResponse.json({ ok: true, shiftId: id })
}
