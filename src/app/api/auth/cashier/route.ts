import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { verifyCashierPin, signCashierToken } from "@/lib/auth/cashier"
import { requireCashier } from "@/lib/auth/guards"

export async function POST(request: NextRequest) {
  const { cashierId, pin } = await request.json()

  const supabase = createServiceClient()
  const { data: cashier, error } = await supabase
    .from("cashiers")
    .select("id, name, pin_hash, is_active")
    .eq("id", cashierId)
    .single()

  if (error || !cashier || !cashier.is_active) {
    return NextResponse.json({ error: "Invalid cashier" }, { status: 401 })
  }

  const valid = await verifyCashierPin(cashier.pin_hash, pin)
  if (!valid) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
  }

  const { data: activeShift } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "active")
    .single()

  const shiftId = activeShift?.id ?? "none"

  const token = signCashierToken({
    cashierId: cashier.id,
    cashierName: cashier.name,
    shiftId,
  })

  const cookieStore = await cookies()
  cookieStore.set("cashier_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  })

  return NextResponse.json({
    cashierId: cashier.id,
    cashierName: cashier.name,
    shiftId,
  })
}

export async function DELETE() {
  const { error } = await requireCashier()
  if (error) return error

  const cookieStore = await cookies()
  cookieStore.delete("cashier_token")
  return NextResponse.json({ ok: true })
}
