import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function PATCH(_req: NextRequest, ctx: DynContext<"/api/sessions/[id]/void">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { data: session } = await supabase.from("sessions").select("table_id").eq("id", id).single()

  const { data, error: dbError } = await supabase
    .from("sessions")
    .update({ status: "voided", end_time: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  if (session?.table_id) {
    await supabase
      .from("tables")
      .update({ status: "available", current_session_id: null, updated_at: new Date().toISOString() })
      .eq("id", session.table_id)
  }

  return NextResponse.json(data)
}
