import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"
import bcrypt from "bcryptjs"

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/admin/cashiers/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.pin !== undefined) {
    updateData.pin_hash = body.pin ? await bcrypt.hash(body.pin, 12) : null
  }

  const { data, error: dbError } = await supabase
    .from("cashiers")
    .update(updateData)
    .eq("id", id)
    .select("id, name, is_active, updated_at")
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: DynContext<"/api/admin/cashiers/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  await supabase.from("cashiers").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id)
  return NextResponse.json({ ok: true })
}
