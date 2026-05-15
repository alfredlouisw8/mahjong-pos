import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"
import { computePerMinuteCharge } from "@/lib/billing/perMinute"

export async function POST(request: NextRequest, ctx: DynContext<"/api/sessions/[id]/close">) {
  const { error, cashier } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))

  const supabase = createServiceClient()
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single()

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  if (session.status !== "active") return NextResponse.json({ error: "Session already closed" }, { status: 400 })

  const endTime = new Date().toISOString()
  let tableCharge = session.table_charge ?? 0

  if (session.billing_mode === "per_minute") {
    tableCharge = computePerMinuteCharge(session.start_time, endTime, session.hourly_rate)
  }

  const { data, error: dbError } = await supabase
    .from("sessions")
    .update({
      status: "closed",
      end_time: endTime,
      closed_by: cashier?.cashierId ?? null,
      table_charge: tableCharge,
      notes: body.notes ?? null,
      updated_at: endTime,
    })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  await supabase
    .from("tables")
    .update({ status: "available", current_session_id: null, updated_at: endTime })
    .eq("id", session.table_id)

  return NextResponse.json(data)
}
