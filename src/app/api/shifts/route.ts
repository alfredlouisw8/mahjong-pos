import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireCashier } from "@/lib/auth/guards"
import { cookies } from "next/headers"
import { signCashierToken } from "@/lib/auth/cashier"

export async function POST(request: NextRequest) {
  const { error } = await requireCashier()
  if (error) return error

  const { openingCash, cashierId } = await request.json()
  const supabase = createServiceClient()

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .insert({ opening_cash: openingCash, status: "active" })
    .select()
    .single()

  if (shiftError) return NextResponse.json({ error: shiftError.message }, { status: 500 })

  await supabase.from("shift_employees").insert({
    shift_id: shift.id,
    cashier_id: cashierId,
  })

  const { data: cashier } = await supabase.from("cashiers").select("name").eq("id", cashierId).single()

  const token = signCashierToken({
    cashierId,
    cashierName: cashier?.name ?? "",
    shiftId: shift.id,
  })

  const cookieStore = await cookies()
  cookieStore.set("cashier_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  })

  return NextResponse.json(shift, { status: 201 })
}
