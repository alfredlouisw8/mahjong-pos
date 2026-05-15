import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin, requireAnyStaff } from "@/lib/auth/guards"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/tables/[id]">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("tables")
    .select(`*, sessions(*, orders(*))`)
    .eq("id", id)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/tables/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("tables")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: DynContext<"/api/tables/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("table_id", id)
    .limit(1)

  if (sessions?.length) {
    const { error: dbError } = await supabase
      .from("tables")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ deleted: false, deactivated: true })
  }

  const { error: dbError } = await supabase.from("tables").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
