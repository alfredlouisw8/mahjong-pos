import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"
import { getConfig } from "@/lib/config"
import { computeBlockEndsAt, computeBlockCharge } from "@/lib/billing/blockHour"

export async function POST(request: NextRequest) {
  const { error, cashier } = await requireAnyStaff()
  if (error) return error

  const { tableId, blocksCount = 1 } = await request.json()
  const config = await getConfig()
  const supabase = createServiceClient()

  const { data: activeShift } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "active")
    .single()

  const startTime = new Date().toISOString()
  const isBlockHour = config.billing_mode === "block_hour"

  const sessionData: Record<string, unknown> = {
    table_id: tableId,
    shift_id: activeShift?.id ?? null,
    opened_by: cashier?.cashierId ?? null,
    start_time: startTime,
    billing_mode: config.billing_mode,
    hourly_rate: config.hourly_rate,
    status: "active",
  }

  if (isBlockHour) {
    sessionData.blocks_purchased = blocksCount
    sessionData.block_ends_at = computeBlockEndsAt(startTime, blocksCount).toISOString()
    sessionData.table_charge = computeBlockCharge(blocksCount, config.hourly_rate)
  } else {
    sessionData.blocks_purchased = 0
    sessionData.table_charge = 0
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert(sessionData)
    .select()
    .single()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  await supabase
    .from("tables")
    .update({
      status: "occupied",
      current_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tableId)

  return NextResponse.json(session, { status: 201 })
}
