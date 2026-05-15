import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/sessions/[id]/extend">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const { blocks } = await request.json()

  const supabase = createServiceClient()
  const { data: session } = await supabase
    .from("sessions")
    .select("blocks_purchased, block_ends_at, hourly_rate, table_charge")
    .eq("id", id)
    .single()

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const newBlockCount = (session.blocks_purchased ?? 0) + blocks
  const currentEndsAt = new Date(session.block_ends_at ?? Date.now())
  const newEndsAt = new Date(currentEndsAt.getTime() + blocks * 3_600_000)
  const addedCharge = blocks * session.hourly_rate
  const newCharge = (session.table_charge ?? 0) + addedCharge

  const { data, error: dbError } = await supabase
    .from("sessions")
    .update({
      blocks_purchased: newBlockCount,
      block_ends_at: newEndsAt.toISOString(),
      table_charge: newCharge,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
