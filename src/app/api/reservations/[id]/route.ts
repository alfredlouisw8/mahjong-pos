import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff, requireAdmin } from "@/lib/auth/guards"

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/reservations/[id]">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("reservations")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: DynContext<"/api/reservations/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { error: dbError } = await supabase.from("reservations").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
