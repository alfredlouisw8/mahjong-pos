import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/admin/menu/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase
    .from("menu_items")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: DynContext<"/api/admin/menu/[id]">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { data: hasOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("menu_item_id", id)
    .limit(1)

  if (hasOrders?.length) {
    const { error: dbError } = await supabase
      .from("menu_items")
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ deleted: false, deactivated: true })
  }

  const { error: dbError } = await supabase.from("menu_items").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
